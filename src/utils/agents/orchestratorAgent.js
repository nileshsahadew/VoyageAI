import { PromptTemplate } from "@langchain/core/prompts";
import { geminiModel } from "@/llms";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import itineraryGeneratorAgent from "./itineraryGeneratorAgent";

let previousAgentState = {
  userMessages: [],
  userEmail: "",
  userName: "",
  inputSummary: "",
  outputResponse: undefined,
  evaluatorConditions: [],
  itineraryDraft: undefined,
};

const AgentState = Annotation.Root({
  userMessages: Annotation,
  userEmail: Annotation,
  userName: Annotation,
  inputSummary: Annotation,
  outputResponse: Annotation,
  evaluatorConditions: Annotation,
  itineraryDraft: Annotation,
});

const summarizerNode = async (state) => {
  const summary = await geminiModel.invoke(`
    Make a summary of the following conversation.
    It MUST be in text format, NOT JSON!!
    Capture all the important details:
    ${state.userMessages}`);
  console.log("Summary: ", summary.content);
  return { inputSummary: summary.content?.text || summary.content };
};

const evaluatorNode = async (state) => {
  const conditionsSchema = {
    type: "object",
    properties: {
      itineraryDuration: {
        type: "number",
        description:
          "The number of days for the itinerary, if provided by the user in the conversation history.",
      },
      generateItinerary: {
        type: "boolean",
        description: "Does the user want to generate an itinerary?",
      },
      itineraryPreferences: {
        type: "string",
        description: "The user's preferences for the itinerary, if any.",
      },
      finalizeItinerary: {
        type: "boolean",
        description:
          "If the user wants to finalize the itinerary from the draft.",
      },
    },
    required: [
      "itineraryDuration",
      "generateItinerary",
      "itineraryPreferences",
      "finalizeItinerary",
    ],
  };

  const systemPrompt = new SystemMessage(`
      Based on the conversation context, determine the following conditions:
      1. Does the user want to generate an itinerary? (generateItinerary)
      2. What is the number of days the user has provided for the itinerary/trip? (itineraryDuration)
      3. If the user wants to generate an itinerary, what are their preferences? (itineraryPreferences)
      4. Does the user want to finalize the itinerary from the draft? (finalizeItinerary)
    `);
  const userPrompt = new HumanMessage(
    `Do not generate an itinerary/attractions if my message is not clear/lacks context.
     Number of days is 0 unless specified.
     Message: ${state.inputSummary}`
  );

  const evaluatorLLM = geminiModel.withStructuredOutput(conditionsSchema);
  let conditions = await evaluatorLLM.invoke([systemPrompt, userPrompt]);

  if (
    !(
      "itineraryDuration" in conditions &&
      "generateItinerary" in conditions &&
      "itineraryPreferences" in conditions &&
      "finalizeItinerary" in conditions
    )
  ) {
    return "evaluatorNode";
  }
  conditions = { ...previousAgentState.evaluatorConditions, ...conditions };

  console.log("Conditions evaluated:", conditions);
  return { evaluatorConditions: conditions };
};

const generalQANode = async (state, config) => {
  const systemPrompt = `
      You should not generate a plan or itinerary here.
      Instead, you should only answer the user's question based on the conversation history.
      If the user asks for an itinerary, you should return a message indicating that they     
      need to generate a plan first.

      Ask for clarification if the question is not clear. Respond to user queries while trying
      to pitch your itinerary planner services.
      NOTE YOU SHOULD NOT GENERATE JSON!!
    `;
  const userPrompt = new HumanMessage(
    `REPLY IN 1-2 SENTENCES ONLY. If what I am saying
       is not clear/lacks context, ask for clarification.
       Message: ${state.inputSummary} `
  );
  console.log("General QA Node input summary: ", state.inputSummary);

  const stream = await geminiModel.stream([systemPrompt, userPrompt]);

  let outputResponse = "";
  for await (const chunk of stream) {
    outputResponse += chunk;
    if (config.writer) {
      config.writer({ event: "text", data: chunk });
    }
  }
  console.log("GeneralQANode: ", outputResponse?.content);
  return { outputResponse: outputResponse };
};

const generateItineraryNode = async (state, config) => {
  try {
    console.log("Generating itinerary..");
    const result = await itineraryGeneratorAgent.invoke({
      itineraryDuration: state.evaluatorConditions.itineraryDuration,
      itineraryPreferences: state.evaluatorConditions.itineraryPreferences,
    });
    if (config.writer) {
      console.log("Result: ", result);
      config.writer({
        event: "json-itinerary",
        data: JSON.stringify(result.itinerary),
      });
    }

    return {
      outputResponse: result?.itinerary || [],
      itineraryDraft: result?.itinerary || [],
    };
  } catch (err) {
    console.error("Error in generateItineraryNode:", err);
    throw err;
  }
};

function extractItineraryFromHistory(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (
      message.role === "assistant" &&
      message.message &&
      message.message.itinerary
    ) {
      return message.message.itinerary;
    }
  }

  return [];
}

const finalizeAndEmailNode = async (state, config) => {
  try {
    if (config.writer) {
      config.writer({
        event: "text",
        data: "Preparing your calendar and sending via email...",
      });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const itineraryFromState = Array.isArray(state.itineraryDraft)
      ? state.itineraryDraft
      : [];
    const itineraryFromHistory = extractItineraryFromHistory(
      state.userMessages
    );
    const itinerary = itineraryFromState.length
      ? itineraryFromState
      : itineraryFromHistory;

    const response = await fetch(`${baseUrl}/api/generate-itinerary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userInput: state.userInput,
        itinerary: itinerary.length ? itinerary : undefined,
        recipientEmail: state.userEmail,
        recipientName: state.userName,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      const message = result?.error || "Failed to send email";
      if (config.writer) {
        config.writer({ event: "text", data: `Error: ${message}` });
      }
      return { outputResponse: message };
    }

    if (config.writer) {
      config.writer({
        event: "text",
        data: "Email sent! Check your inbox for the itinerary PDF and calendar.",
      });
    }
    return { outputResponse: "Email sent" };
  } catch (err) {
    console.error("Error in finalizeAndEmailNode:", err);
    if (config.writer) {
      config.writer({
        event: "text",
        data: "An error occurred while sending the email.",
      });
    }
    return { outputResponse: "Failed to send" };
  }
};

const orchestratorAgent = new StateGraph(AgentState)
  .addNode("summarizerNode", summarizerNode)
  .addNode("generalQANode", generalQANode)
  .addNode("evaluatorNode", evaluatorNode)
  .addNode("generateItineraryNode", generateItineraryNode)
  .addNode("finalizeAndEmailNode", finalizeAndEmailNode)
  .addEdge("__start__", "summarizerNode")
  .addEdge("summarizerNode", "evaluatorNode")
  .addConditionalEdges("evaluatorNode", (state, config) => {
    if (state.evaluatorConditions.finalizeItinerary) {
      return "finalizeAndEmailNode";
    }
    if (state.evaluatorConditions.generateItinerary) {
      if (state.evaluatorConditions.itineraryDuration >= 1) {
        console.log("Conditions met for generateItineraryNode");
        return "generateItineraryNode"; // Routes to generateItineraryNode
      } else {
        console.log(
          "Conditions not met for generateItineraryNode, asking for itinerary duration."
        );
        if (config.writer) {
          config.writer({
            event: "text",
            data: `Please provide a valid number of days for the trip.`,
          });
        }
        return START;
      }
    }
    console.log("Conditions not met, returning to generalQANode");
    return "generalQANode"; // Routes to generalQANode
  })
  .compile();

export default orchestratorAgent;
