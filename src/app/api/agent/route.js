import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { createUIMessageStreamResponse, UIMessage } from "ai";
import { toUIMessageStream } from "@ai-sdk/langchain";
import { geminiModel } from "@/llms";

const promptTemplate = PromptTemplate.fromTemplate(`
You are a smart travelling agent for Mauritius.
The current conversation history is:
{context}

User's request: {question}
`);

const chain = RunnableSequence.from([promptTemplate, geminiModel]);

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
