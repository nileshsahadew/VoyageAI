import orchestratorAgent from "@/utils/agents/orchestratorAgent";

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const last = messages[messages.length - 1];
    const conversationHistory = messages
      .slice(0, -1)
      .map((m) => `${m.role}: ${m.message}`)
      .join("\n");

    const stream = await orchestratorAgent.stream(
      {
        userInput: last.message,
        conversationHistory: conversationHistory,
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
      },
    });
  } catch (err) {
    console.error("Error in agent route:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

function encodeSSEEvent(stream) {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      // Emit text-start event
      controller.enqueue(encoder.encode(`event: start\ndata: \n\n`));

      for await (const event of stream) {
        console.log("Received event:", event);
        let dataToSend;
        if (
          event.data &&
          event.data.kwargs &&
          typeof event.data.kwargs.content === "string"
        ) {
          dataToSend = event.data.kwargs.content;
        } else {
          dataToSend = JSON.stringify(event.data);
        }
        // Always emit as text-delta for each chunk
        controller.enqueue(
          encoder.encode(`event: ${event.event}\ndata: ${dataToSend}\n\n`)
        );
      }

      // Emit text-end event
      controller.enqueue(encoder.encode(`event: end\ndata: \n\n`));
      controller.close();
    },
  });
  return readable;
}
