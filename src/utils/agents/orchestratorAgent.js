import { PromptTemplate } from "@langchain/core/prompts";
import { geminiModel } from "@/llms";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import itineraryGeneratorAgent from "./itineraryGeneratorAgent";

// Remove the global variable and handle state properly

const AgentState = Annotation.Root({
  userMessages: Annotation,
  userEmail: Annotation,
  userName: Annotation,
  inputSummary: Annotation,
  outputResponse: Annotation,
  evaluatorConditions: Annotation,
  itineraryDraft: Annotation,
  vehicleDetails: Annotation,
});

const summarizerNode = async (state) => {
const systemPrompt = new SystemMessage(`
    DO NOT PROVIDE ANY ADVICE OR ASK THE USER QUESTIONS!!!
    Make a summary of the following conversation. Your summary should be in text format
    and NOT in JSON format! DO NOT reply to my message AND do NOT ask about further
    details from me, only summarize what is given below as needed:`)
    const userPrompt = new HumanMessage(state.userMessages+"Do not reply to my message and do not ask about further details from me, only summarize what is given below as needed.");
  const summary = await geminiModel.invoke([systemPrompt, userPrompt]);
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
      bookTickets: {
        type: "boolean",
        description: "Will the user book flight tickets to Mauritius?",
      },
      numberOfPeople: {
        type: "number",
        description: "The number of people this itinerary will cater to.",
      },
      transport: {
        type: "string",
        description: "The transport of choice for the itinerary.",
      },
      finalizeItinerary: {
        type: "boolean",
        description:
          "If the user wants to finalize the itinerary from the draft.",
      },
      hasDisabledPerson: {
        type: "boolean",
        description: "whether there is a disabled person in the group"
      }
    },
    required: [
      "itineraryDuration",
      "generateItinerary",
      "itineraryPreferences",
      "bookTickets",
      "numberOfPeople",
      "transport",
      "finalizeItinerary",
      "hasDisabledPerson",
    ],
  };

  const systemPrompt = new SystemMessage(`
      Based on the conversation context, determine the following conditions:
      1. Does the user want to generate an itinerary? (generateItinerary)
      2. What is the number of days the user has provided for the itinerary/trip? (itineraryDuration)
      3. If the user wants to generate an itinerary, what are their preferences? (itineraryPreferences)
      4. Does the user want to book flight tickets to Mauritius? (bookTickets)
      5. How many people will be on this trip? (numberOfPeople)
      6. What will be the transport of choice for this trip? (transport)
      4. Does the user want to finalize the itinerary from the draft? (finalizeItinerary)
    `);
  const userPrompt = new HumanMessage(
    `Analyze the user's message to extract details for an itinerary.
     If the user expresses intent to plan a trip or generate an itinerary, set 'generateItinerary' to true.
     If specific preferences are mentioned (e.g., "beaches", "nature"), capture them in 'itineraryPreferences'.
     Extract 'itineraryDuration', 'numberOfPeople', 'transport', 'bookTickets', and 'hasDisabledPerson' if explicitly stated.
     If the message contains structured data like "itineraryDuration=1; numberOfPeople=1; transport=Taxi", parse these values correctly.
     If 'generateItinerary' is true but 'itineraryDuration' is not specified or is 0, indicate that more details are needed.
     Message: ${state.inputSummary}`
  );

  const evaluatorLLM = geminiModel.withStructuredOutput(conditionsSchema);
  let conditions = await evaluatorLLM.invoke([systemPrompt, userPrompt]);

  // Normalize null/undefined and apply simple heuristics from the user's text
  const summaryText = String(state?.inputSummary || state?.userMessages || "").toLowerCase();
  
  // Check for structured data format like "itineraryDuration=1; numberOfPeople=1; transport=Taxi"
  const structuredDataMatch = summaryText.match(/itineraryduration=(\d+)/i);
  const peopleMatch = summaryText.match(/numberofpeople=(\d+)/i);
  const transportMatch = summaryText.match(/transport=([^;]+)/i);
  const disabledMatch = summaryText.match(/hasdisabledperson=(true|false)/i);
  const ticketsMatch = summaryText.match(/booktickets=(true|false)/i);
  
  const wantsItinerary =
    conditions?.generateItinerary === true || 
    /\b(itinerary|plan|trip|generate)\b/.test(summaryText) ||
    structuredDataMatch; // If structured data is present, they want an itinerary
    
  const inferredPrefs = conditions?.itineraryPreferences ||
    (summaryText.includes("beach") ? "beach" : undefined) ||
    (summaryText.includes("nature") ? "nature" : undefined) ||
    (summaryText.includes("culture") ? "culture" : undefined);

  conditions = {
    itineraryDuration: Number(conditions?.itineraryDuration) || Number(structuredDataMatch?.[1]) || 0,
    generateItinerary: wantsItinerary,
    itineraryPreferences: inferredPrefs || "",
    bookTickets: !!conditions?.bookTickets || ticketsMatch?.[1] === "true",
    numberOfPeople: Number(conditions?.numberOfPeople) || Number(peopleMatch?.[1]) || 0,
    transport: typeof conditions?.transport === "string" ? conditions.transport : (transportMatch?.[1] || ""),
    finalizeItinerary: !!conditions?.finalizeItinerary,
    hasDisabledPerson: !!conditions?.hasDisabledPerson || disabledMatch?.[1] === "true",
  };

  console.log("Conditions evaluated:", conditions);
  return { evaluatorConditions: conditions };
};

const generalQANode = async (state, config) => {
  const systemPrompt = `
      You are a concise, neutral assistant.
      - Do NOT generate a plan or itinerary here.
      - Keep replies to 1–2 sentences.
      - Never output raw field labels like "generateItinerary: null"; instead, ask for the missing info in plain language.
      - If the user wants an itinerary but details are missing, ask for the missing fields directly (days, people, transport, disability, tickets) in one sentence.
      - If there is enough info, say: "Say 'generate itinerary' to proceed."
      - Never output JSON.
    `;
  const userPrompt = new HumanMessage(
    `Message: ${state.inputSummary}`
  );
  console.log("General QA Node input summary: ", state.inputSummary);

  const stream = await geminiModel.stream([systemPrompt, userPrompt]);

  let outputResponse = "";
  for await (const chunk of stream) {
    let piece = "";
    if (typeof chunk === "string") {
      piece = chunk;
    } else if (chunk && typeof chunk === "object") {
      piece = chunk?.content?.[0]?.text || chunk?.content || chunk?.delta || chunk?.kwargs?.content || "";
    }
    if (!piece) continue;
    outputResponse += piece;
    if (config.writer) {
      config.writer({ event: "text", data: piece });
    }
  }
  console.log("GeneralQANode output: ", outputResponse);
  return { outputResponse: outputResponse };
};

const generateItineraryNode = async (state, config) => {
  try {
    console.log("Generating itinerary..");
    const result = await itineraryGeneratorAgent.invoke({
      itineraryDuration: state.evaluatorConditions.itineraryDuration,
      itineraryPreferences: state.evaluatorConditions.itineraryPreferences,
    });

    // Hardcode transport to Sedan with price
    const vehicleDetails = {
      type: "Sedan (Suitable for up to 5 people). Price: 80$",
      note: "Wheelchair Assigned.",
    };

    const itineraryWithVehicle = {
      itinerary: result.itinerary || [],
      vehicleDetails: vehicleDetails
    };

    if (config.writer) {
      console.log("Result: ", result);
      config.writer({
        event: "json-itinerary",
        data: result,
      });
    }

    return {
      outputResponse: itineraryWithVehicle,
      itineraryDraft: result?.itinerary || [],
      vehicleDetails: vehicleDetails
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

      // Hardcode transport to Sedan with price for email/PDF
      const vehicleDetails = {
        type: "Sedan (Suitable for up to 5 people). Price: 80$",
        note: "Wheelchair Assigned."
      };

    const response = await fetch(`${baseUrl}/api/generate-itinerary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userInput: state.inputSummary || "",
        itinerary: itinerary.length ? itinerary : undefined,
        recipientEmail: state.userEmail,
        recipientName: state.userName,
        vehicleDetails: vehicleDetails
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

const vehicleAssignmentNode  = async (state, config) => {
  const numPeople = Number(state?.evaluatorConditions?.numberOfPeople) || 0;
  const hasDisabled = !!state?.evaluatorConditions?.hasDisabledPerson;
  console.log("vehicleAssignmentNode", numPeople, hasDisabled);
  
  let vehicle;
  if (numPeople <=5) {
    vehicle = "Sedan (Suitable for up to 5 people). Price: 80$";
  } else if (numPeople <=7) {
    vehicle = "7-seater car (suitable for groups of up to 7). Price: 85$";
  } else {
    vehicle = "Mini Van (suitable for larger groups). Price: 90$";
  }

  let extras = hasDisabled ? "We also provide a wheelchair free of charge for disabled travelers." : "No special accessibility features.";

    const vehicleDetails = {
      type: vehicle,
      note: extras
    };

  const message = `Recommended Vehicle: ${vehicleDetails.type}. ${vehicleDetails.note}`;

  if (config.writer) {
    config.writer({event: "text", data: message});
  }

  return { 

    vehicleDetails: vehicleDetails,
    outputResponse: message

  };
};

const orchestratorAgent = new StateGraph(AgentState)
  .addNode("summarizerNode", summarizerNode)
  .addNode("generalQANode", generalQANode)
  .addNode("evaluatorNode", evaluatorNode)
  .addNode("generateItineraryNode", generateItineraryNode)
  .addNode("finalizeAndEmailNode", finalizeAndEmailNode)
  .addNode("vehicleAssignmentNode", vehicleAssignmentNode )
  .addEdge("__start__", "summarizerNode")
  .addEdge("summarizerNode", "evaluatorNode")
  .addEdge("vehicleAssignmentNode", "generateItineraryNode")
  .addConditionalEdges("evaluatorNode", (state, config) => {
    const conditions = state.evaluatorConditions;
    console.log("Evaluator conditions:", conditions);
    
    if (conditions?.finalizeItinerary) {
      return "finalizeAndEmailNode";
    }

    if (state.evaluatorConditions.generateItinerary) {
      if (state.evaluatorConditions.itineraryDuration >= 1) {
        console.log("Conditions met for generateItineraryNode");
        // Always go to vehicle assignment first if we have group info
      if (state.evaluatorConditions.numberOfPeople) {
        console.log("Routing to vehicle assignment");
        return "vehicleAssignmentNode";
      } else {
        console.log("No group size info, skipping vehicle assignment");
        // Set hardcoded Sedan vehicle details by default
        return {
          vehicleDetails: {
            type: "Sedan (Suitable for up to 5 people). Price: 80$",
            note: "Wheelchair Assigned."
          },
          next: "generateItineraryNode"
        };
      }
      }  else {
        console.log("Insufficient details. Sending request for more details");
        if (config.writer) {
          config.writer({
            event: "request-itinerary",
            data: state.evaluatorConditions,
          });
        }
        return START;
      }

    }
    
    console.log("No itinerary generation requested, going to general QA");
    return "generalQANode";
  })
  .compile();

export default orchestratorAgent;
