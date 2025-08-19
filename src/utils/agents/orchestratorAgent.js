import { PromptTemplate } from "@langchain/core/prompts";
import { geminiModel } from "@/llms";
import { Annotation, END, StateGraph } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const AgentState = Annotation.Root({
  userInput: Annotation,
  conversationHistory: Annotation,
  outputResponse: Annotation,
  conditions: Annotation,
});

const evaluatorNode = async (state) => {
  const conditionsSchema = {
    type: "object",
    properties: {
      generateAttractions: {
        type: "boolean",
        description:
          "The user explicitly asked for a plan of attractions to be generated.",
      },
      hasPlan: {
        type: "boolean",
        description: "Is there already a plan generated?",
      },
      generateItinerary: {
        type: "boolean",
        description:
          "If there already is a plan, does the user want to generate an itinerary from it?",
      },
    },
    required: ["generateAttractions", "hasPlan", "generateItinerary"],
  };
  const promptTemplate = PromptTemplate.fromTemplate(`
      Conversation history for context:
      {conversationHistory}

      Based on the conversation history, determine the following conditions:
      1. Should attractions be generated? (generateAttractions)
      2. Is there already a plan generated? (hasPlan)
      3. If there is a plan, does the user want to generate an itinerary from it? (generateItinerary)
    `);

  const promptValue = await promptTemplate.invoke({
    conversationHistory: state.conversationHistory,
  });

  const evaluatorLLM = geminiModel.withStructuredOutput(conditionsSchema);

  const conditions = await evaluatorLLM.invoke([
    new SystemMessage(promptValue),
    new HumanMessage(
      "Do not reply! If my message is not clear/lacks context, do not try to generate attractions/itenerary. Message:" +
        state.userInput
    ),
  ]);
  if (!conditions) {
    throw new Error("evaluatorNode: LLM returned undefined conditions");
  }
  console.log("Conditions evaluated:", conditions);
  return { conditions: conditions };
};

const generalQANode = async (state, config) => {
  const promptTemplate = PromptTemplate.fromTemplate(`
      You should not generate a plan or itinerary here.
      Instead, you should only answer the user's question based on the conversation history.
      If the user asks for an itinerary, you should return a message indicating that they     
      need to generate a plan first.

      The current conversation history is:
      {conversationHistory}

      Ask for clarification if the question is not clear.
    `);
  const promptValue = await promptTemplate.invoke({
    conversationHistory: state.conversationHistory,
  });

  // Note: Si sa pln pa compran system prompt la, met li dan user prompt, li marC lerla
  const stream = await geminiModel.stream([
    new SystemMessage(promptValue),
    new HumanMessage(
      "REPLY IN 1-2 SENTENCES ONLY. If what I am saying is not clear/lacks context, ask for clarification. Message: " +
        state.userInput
    ),
  ]);

  let outputResponse = "";
  for await (const chunk of stream) {
    outputResponse += chunk;
    // Assign a custom event name for SSE
    if (config.writer) {
      config.writer({ event: "text", data: chunk });
    }
  }
  return { outputResponse: outputResponse };
};

const node3 = async (state) => {
  try {
    return END;
  } catch (err) {
    console.error("Error in node3:", err);
    throw err;
  }
};

const orchestratorAgent = new StateGraph(AgentState)
  .addNode("generalQANode", generalQANode)
  .addNode("evaluatorNode", evaluatorNode)
  .addNode("node3", node3)
  .addEdge("__start__", "evaluatorNode")
  .addConditionalEdges("evaluatorNode", (state) => {
    if (
      state.conditions.generateAttractions ||
      (state.conditions.hasPlan && state.conditions.generateItinerary)
    ) {
      console.log("Conditions met for node3");
      return "node3"; // Routes to node3
    }
    console.log("Conditions not met, returning to generalQANode");
    return "generalQANode"; // Routes to generalQANode
  })
  .compile();

export default orchestratorAgent;
