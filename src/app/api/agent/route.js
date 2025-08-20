import orchestratorAgent from "@/utils/agents/orchestratorAgent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const safeMessages = Array.isArray(messages) ? messages : [];
    const conversation = safeMessages
      .map((m) => `${m.type || m.role}: ${m.message}`)
      .join("\n");

    const session = await getServerSession(authOptions);

    const stream = await orchestratorAgent.stream(
      {
        userMessages: conversation,
        userEmail: session?.user?.email,
        userName: session?.user?.name,
      },
      { streamMode: "custom" }
    );

    const readable = encodeSSEEvent(stream);
    return new Response(readable, {
      headers: {
        "Content-Encoding": "none",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("Error in agent route:", err);
    console.error("Error stack:", err.stack);
    return new Response(JSON.stringify({ 
      error: "Internal Server Error", 
      details: err.message,
      stack: err.stack 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function encodeSSEEvent(stream) {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      // Emit text-start event
      controller.enqueue(encoder.encode(`event: start\ndata: start\n\n`));

      for await (const event of stream) {
        console.log("Received event:", event);
        let dataToSend;
        if (typeof event.data === "string") {
          dataToSend = event.data;
        } else if (
          event.data &&
          event.data.kwargs &&
          typeof event.data.kwargs.content === "string"
        ) {
          dataToSend = event.data.kwargs.content;
        } else if (event.data && typeof event.data.content === "string") {
          dataToSend = event.data.content;
        } else {
          dataToSend = JSON.stringify(event.data);
        }
        // Always emit as text for each chunk
        const eventName = event.event === "text-delta" ? "text" : event.event;
        controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${dataToSend}\n\n`));
      }

      // Emit text-end event
      controller.enqueue(encoder.encode(`event: end\ndata: end\n\n`));
      controller.close();
    },
  });
  return readable;
}
