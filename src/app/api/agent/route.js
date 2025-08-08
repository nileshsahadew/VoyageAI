// You will need to install the package: npm install @langchain/google-genai
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const runtime = "edge";

export async function POST(req) {
  try {
    const { message, history } = await req.json();

    // The LangChain model automatically handles roles. We just need to map our
    // chat history format to LangChain's expected format.
    const mappedHistory = history.map((msg) => ({
      role: msg.type === "user" ? "user" : "model",
      content: msg.message,
    }));

    // Instantiate the GoogleGenerativeAI model.
    // In a real-world scenario, you would use process.env.GEMINI_API_KEY
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY, 
      model: "gemini-2.5-flash-preview-05-20",
      temperature: 0.7,
      streaming: true,
    });
    
    // Use the LangChain model's stream method to get a streaming response.
    // The model will automatically handle the chat history you provide.
    const stream = await model.stream(mappedHistory);
    
    // We can then pipe the LangChain stream directly to a new Response object.
    const textEncoder = new TextEncoder();
    const readableStream = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            controller.enqueue(textEncoder.encode(chunk.content));
          }
          controller.close();
        }
    });

    return new Response(readableStream, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("LangChain API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
