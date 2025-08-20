import { embeddingModel, geminiModel } from "@/llms";
import { Annotation, START, END, StateGraph } from "@langchain/langgraph";
import { initializeVectorStore, loadVectorStore } from "../RAG";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import path from "path";
import { PromptTemplate } from "@langchain/core/prompts";

const datasetDir = path.resolve("datasets/mauritius_attractions_dataset");
const vectorStorePath = path.resolve("datasets/vector_store.json");

const AgentState = Annotation.Root({
  itineraryPreferences: Annotation,
  itineraryDuration: Annotation,
  queries: Annotation,
  attractions: Annotation,
  itinerary: Annotation,
});

const queryFormulatorNode = async (state) => {
  const queriesSchema = {
    type: "array",
    items: {
      type: "string",
      description: "A query based on the user's input to find attractions.",
    },
  };
  const systemPrompt = new SystemMessage(
    `Formulate queries on the preferences of the attractions the user wants
     based on the context provided.`
  );
  const userPrompt = new HumanMessage(
    ` Itinerary Preferences: ${
      state?.itineraryPreferences ||
      "High Popularity (Good ratings, High Audience Popularity, etc)"
    } `
  );

  const augmentedModel = geminiModel.withStructuredOutput(queriesSchema);
  const queries = await augmentedModel.invoke([systemPrompt, userPrompt]);
  return { queries: queries };
};

const attractionsFinderNode = async (state) => {
  let vectorStore = null;
  try {
    vectorStore = await loadVectorStore(vectorStorePath);
  } catch (error) {
    await initializeVectorStore(embeddingModel, datasetDir, vectorStorePath);
    vectorStore = await loadVectorStore(vectorStorePath);
  }

  const rawDuration = Number(state?.itineraryDuration);
  const safeDuration = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 3;

  let attractions = [];
  for (const query of state.queries) {
    attractions = [
      ...attractions,
      ...(await vectorStore.similaritySearch(query, safeDuration * 3)),
    ];
  }

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  attractions = shuffleArray(attractions);
  const finalAttractions = attractions.slice(0, safeDuration * 3);

  return { attractions: finalAttractions };
};

const itineraryGeneratorNode = async (state) => {
  const itinerarySchema = {
    type: "object",
    properties: {
      itinerary: {
        type: "array",
        description:
          "A list of attractions with their corresponding details for an itinerary.",
        items: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "The date of the attraction in YYYY-MM-DD format.",
            },
            day: {
              type: "string",
              description:
                "The day of the week for the attraction (e.g., 'Monday').",
            },
            hour: {
              type: "string",
              description: "The time of the attraction (e.g., '10:00 AM').",
            },
            location: {
              type: "string",
              description: "The specific location name of the attraction.",
            },
            region: {
              type: "string",
              description: "The geographical region of the attraction.",
            },
            description: {
              type: "string",
              description: "A brief description of the attraction.",
            },
            attraction_name: {
              type: "string",
              description: "The name of the attraction.",
            },
            rating: {
              type: "number",
              description: "The rating of the attraction over 5.",
            },
            url: {
              type: "string",
              description: "The google maps url for the attraction.",
            },
          },
          required: [
            "date",
            "day",
            "hour",
            "location",
            "region",
            "description",
            "attraction_name",
            "rating",
            "url",
          ],
        },
      },
    },
    required: ["itinerary"],
  };
  const promptTemplate = PromptTemplate.fromTemplate(`
    The current date is {date} and the current day is {day}.
    Generate an itinerary based on the following attractions:
    {attractions}
    
    There must be at least {minAttractions} attractions for {days} days.`);
  const augementedModel = geminiModel.withStructuredOutput(itinerarySchema);
  const rawDays = Number(state?.itineraryDuration ?? state?.numberOfDays);
  const safeDays = Number.isFinite(rawDays) && rawDays > 0 ? rawDays : 3;
  const minAttractions = safeDays * 3;
  const itinerary = await augementedModel.invoke(
    await promptTemplate.invoke({
      attractions: state.attractions,
      date: new Date().toISOString().split("T")[0],
      day: new Date().toLocaleString("en-US", { weekday: "long" }),
      minAttractions,
      days: safeDays,
    })
  );
  if (itinerary?.itinerary == null) {
    // Fallback to empty itinerary to keep downstream logic consistent
    return { itinerary: [] };
  }
  console.log("Generated Itinerary:", itinerary);
  return { itinerary: itinerary.itinerary };
};

const itineraryGeneratorAgent = new StateGraph(AgentState)
  .addNode("queryFormulator", queryFormulatorNode)
  .addNode("attractionsFinder", attractionsFinderNode)
  .addNode("itineraryGenerator", itineraryGeneratorNode)
  .addEdge(START, "queryFormulator")
  .addEdge("queryFormulator", "attractionsFinder")
  .addEdge("attractionsFinder", "itineraryGenerator")
  .compile();

export default itineraryGeneratorAgent;
