// import { geminiModel } from "@/llms";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";
import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
chromium.use(stealth);

const NUM_LINKS_SEARCHED = 1;
const geminiModel = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-2.5-flash-preview-05-20",
  temperature: 0.7,
  streaming: true,
});

const attractionListSchema = {
  type: "object",
  properties: {
    attractionNames: {
      type: "array",
      items: {
        type: "string",
      },
      description: "An array of strings representing Mauritius attractions.",
    },
  },
  required: ["attractionNames"],
};

const INITIAL_PROMPT_TEMPLATE = PromptTemplate.fromTemplate(`
     You are an itenerary planner agent for a certain hotel chain.
     Your goal is to take a user's preferences of the places they want to visit,
     reformulate them internally to best identify the recommended places and list
     those places. Note that you are restricted to places only in Mauritius and
     cannot recommend other hotels and accomodations. Your list should contain
     a mixture of popular sites as well as lesser known ones. To add variety,
     include a few sites not in the user's preference but may be related, prioritizing
     restaurants, hypermarkets and shopping malls.

     Generate {numAttractions} attractions based on the user's preferences.
`);

const ATTRACTION_SUMMARIZER_SYSTEM_PROMPT = PromptTemplate.fromTemplate(`
     Summary about {attractionName}: {summary}

     Extend/Make a summary of the attraction based on the content of the HTML.
     The summary should be concise, informative, and highlight the 
     key features of the attraction, including ratings, reviews, and any 
     other relevant information.

     Word count should be between 50 and 100 words.
  `);

const StateAnnotation = Annotation.Root({
  userInput: Annotation,
  numAttractions: Annotation,
  attractions: Annotation,
});

const generateAttractionsList = async (state) => {
  if (
    !state.userInput ||
    typeof state.userInput !== "string" ||
    state.userInput.trim() === ""
  ) {
    throw new Error("userInput is required and must be a non-empty string.");
  }
  const attractionListGeneratorLLM =
    geminiModel.withStructuredOutput(attractionListSchema);
  const prompt = [
    new SystemMessage(
      INITIAL_PROMPT_TEMPLATE.invoke({ numAttractions: state.numAttractions })
    ),
    new HumanMessage({ content: state.userInput }),
  ];
  const result = await attractionListGeneratorLLM.invoke(prompt);
  let attractions = [];
  for (const attractionName of result.attractionNames) {
    attractions = [...attractions, { name: attractionName, summary: "" }];
  }
  console.log("Generated attractions:", attractions);
  return { attractions: attractions };
};

const webSearchAndSummarizeAttractions = async (state) => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const findAttractionURLs = async (query) => {
    const url = `https://www.googleapis.com/customsearch/v1?key=${
      process.env.CUSTOM_SEARCH_API
    }&cx=${process.env.SEARCH_ENGINE_ID}&q=${encodeURIComponent(
      query
    )}&num=${NUM_LINKS_SEARCHED}`;

    const data = await fetch(url);
    if (!data.ok) {
      throw new Error(`Failed to fetch search results: ${data.statusText}`);
    }
    const result = await data.json();
    const attractionURLs = result.items.map((item) => item.link);

    console.log("Attraction URLs found:", attractionURLs);
    return attractionURLs;
  };

  const fetchAndCleanHTML = async (url, page) => {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Remove unnecessary tags and get cleaned text content
    const cleanedText = await page.evaluate(() => {
      // Remove scripts, styles, iframes, and other noisy tags
      const tagsToRemove = [
        "script",
        "style",
        "noscript",
        "iframe",
        "svg",
        "canvas",
        "form",
        "nav",
        "footer",
        "header",
        "aside",
        "button",
        "input",
        "select",
      ];
      tagsToRemove.forEach((tag) => {
        document.querySelectorAll(tag).forEach((el) => el.remove());
      });

      // Remove comments
      const removeComments = (node) => {
        for (let i = node.childNodes.length - 1; i >= 0; i--) {
          const child = node.childNodes[i];
          if (child.nodeType === Node.COMMENT_NODE) {
            node.removeChild(child);
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            removeComments(child);
          }
        }
      };
      removeComments(document.body);

      // Optionally, remove empty elements
      const removeEmpty = (node) => {
        for (let i = node.childNodes.length - 1; i >= 0; i--) {
          const child = node.childNodes[i];
          if (
            child.nodeType === Node.ELEMENT_NODE &&
            child.textContent.trim() === ""
          ) {
            node.removeChild(child);
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            removeEmpty(child);
          }
        }
      };
      removeEmpty(document.body);

      // Return the cleaned text content
      return document.body.innerText;
    });

    return cleanedText;
  };

  const summarizeAttraction = async (attractionName) => {
    let attractionSummary = "";
    const attractionURLs = await findAttractionURLs(attractionName);

    for (const attractionURL of attractionURLs) {
      try {
        const cleanedHTML = await fetchAndCleanHTML(attractionURL, page);

        // Now you can send cleanedHTML to your LLM for summarization
        const response = await geminiModel.invoke([
          new SystemMessage(
            ATTRACTION_SUMMARIZER_SYSTEM_PROMPT.invoke({
              attractionName: attractionName,
              summary: attractionSummary,
            })
          ),
          new HumanMessage({
            content:
              cleanedHTML ?? "Summarise using your existing knowledge base",
          }),
        ]);
        attractionSummary = response.content;
      } catch (e) {
        console.error(`Failed to fetch or clean ${attractionURL}:`, e);
      }
    }
    return attractionSummary;
  };

  // Summarize each attraction in parallel
  let attractions = state.attractions;
  await Promise.all(
    attractions.map(async (attraction) => {
      attraction.summary = await summarizeAttraction(attraction.name);
    })
  );
  await browser.close();
  console.log("Summarized attractions:", attractions);
  return { attractions: attractions };
};

const graph = new StateGraph(StateAnnotation)
  .addNode("node1", generateAttractionsList)
  .addNode("node2", webSearchAndSummarizeAttractions)
  .addEdge("__start__", "node1")
  .addEdge("node1", "node2")
  .compile();

(async () => {
  await graph.invoke({
    userInput:
      "I want to visit Mauritius for 3 days, starting from Blue Bay. I like wildlife, cultural shows, beaches, and historical sites.",
    numAttractions: 8,
  });
})();
