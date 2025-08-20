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
            // event.data may be plain text or a JSON string
            let payload = event.data;
            if (typeof payload === "string" && payload.trim().startsWith("{")) {
              try {
                const parsed = JSON.parse(payload);
                payload = parsed?.kwargs?.content || parsed?.content || parsed;
              } catch (_) {
                // keep as raw string
              }
            }
            this.emit("text", payload);
          } else if (event.event === "json-itinerary") {
            // encodeSSEEvent sends a single JSON.stringify, so parse once
            let obj = null;
            try {
              obj = JSON.parse(event.data);
            } catch (_) {
              obj = null;
            }
            if (obj && Array.isArray(obj.itinerary)) {
              this.emit("json-itinerary", obj.itinerary);
            } else if (Array.isArray(obj)) {
              this.emit("json-itinerary", obj);
            } else {
              this.emit("json-itinerary", obj);
            }
          } else if (event.event === "request-itinerary") {
            console.log("🔍 SSE Client received request-itinerary event:", event.data);
            // Always forward raw string; caller will JSON.parse as needed
            this.emit("request-itinerary", event.data);
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
