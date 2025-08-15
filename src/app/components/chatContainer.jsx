"use client";
import { useEffect, useRef } from "react";
import { Typography, Box } from "@mui/material";

function ChatContainer({ chatMessages }) {
  const containerRef = useRef(null);

  // Scroll to bottom when chatMessages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // If there are no messages, display the welcome prompt
  if (!chatMessages || chatMessages.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          textAlign: "center",
          padding: 2,
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Plan Your Perfect Itinerary
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          To get started, tell me what types of places you'd like to explore in
          Mauritius. I'll use your preferences to suggest some ideal
          destinations just for you.
        </Typography>
      </Box>
    );
  }

  // Render chat history
  return (
    <Box
      ref={containerRef}
      sx={{
        marginLeft: "3%",
        marginRight: "5%",
        width: "auto",
        height: "auto",
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflowY: "auto",
        padding: 2,
      }}
    >
      {chatMessages.map((msg, index) => (
        <Box
          key={index}
          sx={{
            alignSelf: msg.type === "user" ? "flex-end" : "flex-start",
            maxWidth: "70%",
            padding: "12px 16px",
            borderRadius: "20px",
            color: msg.type === "user" ? "white" : "black",
            backgroundColor: msg.type === "user" ? "#1976d2" : "#e0e0e0",
          }}
        >
          <Typography variant="body1">{msg.message}</Typography>
        </Box>
      ))}
    </Box>
  );
}
export default ChatContainer;
