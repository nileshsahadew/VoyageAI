import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const geminiModel = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-2.5-flash-preview-05-20",
  temperature: 0.7,
  streaming: true,
});
