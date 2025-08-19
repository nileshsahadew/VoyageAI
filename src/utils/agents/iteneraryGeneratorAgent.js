import { embeddingModel, geminiModel } from "@/llms";
import { Annotation, START, END, StateGraph } from "@langchain/langgraph";
import { initializeVectorStore, loadVectorStore } from "../RAG";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import path from "path";
import { PromptTemplate } from "@langchain/core/prompts";

const datasetDir = path.resolve("datasets/mauritius_attractions_dataset");
const vectorStorePath = path.resolve("datasets/vector_store.json");

const AgentState = Annotation.Root({
  userInput: Annotation,
  queries: Annotation,
  attractions: Annotation,
  itenerary: Annotation,
});

const queryFormulatorNode = async (state) => {
  const queriesSchema = {
    type: "array",
    items: {
      type: "string",
      description: "A query based on the user's input to find attractions.",
    },
  };
  const augmentedModel = geminiModel.withStructuredOutput(queriesSchema);
  const queries = await augmentedModel.invoke([
    new SystemMessage(
      "Formulate queries on the preferences of the attractions the user wants based on the user input: "
    ),
    new HumanMessage(state.userInput),
  ]);
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

  let attractions = [];
  for (const query of state.queries) {
    attractions = [
      ...attractions,
      ...(await vectorStore.similaritySearch(query, 3)),
    ];
  }
  return { attractions: attractions };
};

const iteneraryGeneratorNode = async (state) => {
  const itenerarySchema = {
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
    {attractions}`);
  const augementedModel = geminiModel.withStructuredOutput(itenerarySchema);
  const itenerary = await augementedModel.invoke(
    await promptTemplate.invoke({
      attractions: state.attractions,
      date: new Date().toISOString().split("T")[0],
      day: new Date().toLocaleString("en-US", { weekday: "long" }),
    })
  );
  console.log("Generated Itinerary:", itenerary);
  return { itenerary: itenerary.itinerary || [] };
};

const iteneraryGeneratorAgent = new StateGraph(AgentState)
  .addNode("queryFormulator", queryFormulatorNode)
  .addNode("attractionsFinder", attractionsFinderNode)
  .addNode("iteneraryGenerator", iteneraryGeneratorNode)
  .addEdge(START, "queryFormulator")
  .addEdge("queryFormulator", "attractionsFinder")
  .addEdge("attractionsFinder", "iteneraryGenerator")
  .addEdge("attractionsFinder", END)
  .compile();

export default iteneraryGeneratorAgent;
