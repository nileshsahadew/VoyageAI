import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { createUIMessageStreamResponse, UIMessage } from "ai";
import { toUIMessageStream } from "@ai-sdk/langchain";

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-2.5-flash-preview-05-20",
  temperature: 0.7,
  streaming: true,
});

const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful and friendly AI assistant.
The current conversation history is:
{context}

User's question: {question}

Your response:
`);

const chain = RunnableSequence.from([promptTemplate, model]);

export async function POST(req) {
  const { messages } = await req.json();
  const last = messages[messages.length - 1];
  const context = messages
    .slice(0, -1)
    .map((m) => `${m.role}: ${m.message}`)
    .join("\n");

  const stream = await chain.stream({
    context: context,
    question: last.message,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream(stream),
  });
}
