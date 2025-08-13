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
          const parsed = JSON.parse(event.data);
          this.emit(parsed.type, parsed);
        } catch (err) {
          if (event.data !== "[DONE]") {
            console.error("Failed to parse SSE JSON:", err);
          }
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
