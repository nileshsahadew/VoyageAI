import { PromptTemplate } from "@langchain/core/prompts";
import { geminiModel } from "@/llms";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import itineraryGeneratorAgent from "./itineraryGeneratorAgent";

const AgentState = Annotation.Root({
  userInput: Annotation,
  conversationHistory: Annotation,
  outputResponse: Annotation,
  evaluatorConditions: Annotation,
  itineraryDraft: Annotation,
});

const evaluatorNode = async (state) => {
  const conditionsSchema = {
    type: "object",
    properties: {
      numberOfDays: {
        type: "number",
        description:
          "The number of days for the trip, if provided by the user in the conversation history.",
      },
      generateItinerary: {
        type: "boolean",
        description: "Does the user want to generate an itinerary?",
      },
      finalizeItinerary: {
        type: "boolean",
        description:
          "If the user wants to finalize the itinerary from the draft.",
      },
    },
    required: ["numberOfDays", "generateItinerary", "finalizeItinerary"],
  };
  const promptTemplate = PromptTemplate.fromTemplate(`
      Conversation history for context:
      {conversationHistory}

      Based on the conversation history, determine the following conditions:
      1. Does the user want to generate an itinerary? (generateItinerary)
      2. What is the number of days the user has provided for the itinerary/trip? (numberOfDays)
      3. Does the user want to finalize the itinerary from the draft? (finalizeItinerary)
    `);

  const systemPrompt = await promptTemplate.invoke({
    conversationHistory: state.conversationHistory,
    evaluatorConditions: state.evaluatorConditions,
  });

  const evaluatorLLM = geminiModel.withStructuredOutput(conditionsSchema);

  const conditions = await evaluatorLLM.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(
      `Do not reply! If my message is not clear/lacks context, 
       do not try to generate attractions/itinerary. 
       Number of days is 0 unless specified.
       Message: ${state.userInput}`
    ),
  ]);
  if (!conditions) {
    throw new Error("evaluatorNode: LLM returned undefined conditions");
  }
  console.log("Conditions evaluated:", conditions);

  return {
    evaluatorConditions: {
      ...conditions,
      generateItinerary:
        state.evaluatorConditions?.generateItinerary &&
        conditions.numberOfDays != 0
          ? state.evaluatorConditions.generateItinerary
          : conditions.generateItinerary,
    },
  };
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

  const stream = await geminiModel.stream([
    new SystemMessage(promptValue),
    new HumanMessage(
      `REPLY IN 1-2 SENTENCES ONLY. If what I am saying
       is not clear/lacks context, ask for clarification.
       Message: ${state.userInput} `
    ),
  ]);

  let outputResponse = "";
  for await (const chunk of stream) {
    outputResponse += chunk;
    // Assign a custom event name for SSE
    if (config.writer) {
      console.log("Chunk received:", chunk);
      config.writer({ event: "text", data: chunk });
    }
  }
  return { outputResponse: outputResponse };
};

const generateItineraryNode = async (state, config) => {
  try {
    const result = await itineraryGeneratorAgent.invoke({
      userInput: state.userInput,
    });
    if (config.writer) {
      console.log("Result: ", result);
      config.writer({
        event: "json-itinerary",
        data: JSON.stringify(result.itinerary),
      });
    }

    return { outputResponse: result?.itinerary || [] };
  } catch (err) {
    console.error("Error in generateItineraryNode:", err);
    throw err;
  }
};

const orchestratorAgent = new StateGraph(AgentState)
  .addNode("generalQANode", generalQANode)
  .addNode("evaluatorNode", evaluatorNode)
  .addNode("generateItineraryNode", generateItineraryNode)
  .addEdge("__start__", "evaluatorNode")
  .addConditionalEdges("evaluatorNode", (state, config) => {
    if (state.evaluatorConditions.generateItinerary) {
      if (state.evaluatorConditions.numberOfDays >= 1) {
        console.log("Conditions met for generateItineraryNode");
        return "generateItineraryNode"; // Routes to generateItineraryNode
      } else {
        if (config.writer) {
          config.writer({
            event: "text",
            data: `Please provide a valid number of days for the trip.`,
          });
        }
        return START; // Routes back to START for clarification
      }
    }
    console.log("Conditions not met, returning to generalQANode");
    return "generalQANode"; // Routes to generalQANode
  })
  .compile();

export default orchestratorAgent;
