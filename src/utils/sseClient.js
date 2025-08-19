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
          if (event.event === "text" || event.event === "json") {
            this.emit(
              event.event,
              JSON.parse(event.data)?.kwargs?.content || event.data
            );
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
