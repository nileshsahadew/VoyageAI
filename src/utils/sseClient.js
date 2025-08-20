import { createParser } from "eventsource-parser";

class SSEClient {
  constructor() {
    this.handlers = {};
  }

  // Subscribe to a specific type of SSE message
  on(type, callback) {
    if (!this.handlers[type]) {
      this.handlers[type] = [];
    }
    this.handlers[type].push(callback);
  }

  // Internal method to trigger callbacks
  emit(type, payload) {
    if (this.handlers[type]) {
      for (const cb of this.handlers[type]) {
        cb(payload);
      }
    }
  }

  async connect(streamingResponse) {
    const reader = streamingResponse.body.getReader();
    const decoder = new TextDecoder();

    const parser = createParser({
      onEvent: (event) => {
        try {
          if (event.event === "text") {
            let payload =
              JSON.parse(event.data)?.kwargs?.content ||
              JSON.parse(event.data)?.content ||
              JSON.parse(event.data);

            console.log("Payload", payload);
            this.emit(event.event, payload);
          } else if (event.event === "json-itinerary") {
            this.emit(event.event, JSON.parse(JSON.parse(event.data)));
          } else if (event.event === "start" || event.event === "end") {
            this.emit(event.event, event.data);
          }
        } catch (err) {
          console.error("Failed to handle SSE event:", err);
        }
      },
    });

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      parser.feed(decoder.decode(value, { stream: true }));
    }
  }
}

export default SSEClient;
