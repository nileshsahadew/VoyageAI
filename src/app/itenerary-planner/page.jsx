"use client";

import {
  Button,
  Box,
  Typography,
  Divider,
  Paper,
  TextField,
  IconButton,
  CircularProgress,
} from "@mui/material";
import ChipList from "../components/chipList";
import { useUIStateContext } from "../providers/UIStateContext";
import { KeyboardReturn } from "@mui/icons-material";
import ChatContainer from "../components/chatContainer";
import { useState } from "react";
import SSEClient from "@/utils/sseClient";

function IteneraryPlannerPage() {
  const [UXMode, setUXMode] = useUIStateContext();
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessageToAgent = async (chatMessages, userMessage) => {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: {
        "message-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [...chatMessages, userMessage], // Send the full history for context
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  };

  // This function handles sending the user's message to the API
  const handleSendMessage = async () => {
    // Prevent sending empty messages or while loading
    if (inputMessage.trim() === "" || isLoading) return;

    const userMessage = { type: "user", message: inputMessage };
    let assistantMessage = { type: "assistant", message: "" };

    // Add the user's message to the chat history & update UI
    setChatMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const streamingResponse = await sendMessageToAgent(
        chatMessages,
        userMessage
      );

      setChatMessages((prevMessages) => [...prevMessages, assistantMessage]);

      // UI Logic for when a new chunk arrives from streamingResponse
      const onNewChunkArrival = (parsed) => {
        assistantMessage.message += parsed.delta;
        setChatMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...assistantMessage };
          return newMessages;
        });
      };

      // SSEClient listens to response stream and will parse each valid arriving chunk
      // before executing the callback
      const sseClient = new SSEClient();
      sseClient.on("text-delta", onNewChunkArrival);
      sseClient.connect(streamingResponse);
    } catch (error) {
      console.error("Failed to fetch from chat API:", error);
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { type: "system", message: "An error occurred. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // The rest of the component will only render if the session is ready
  return UXMode.iteneraryAgentInterface !== "messaging" ? (
    <>
      <Box
        sx={{
          maxWidth: 900,
          mx: "auto",
          px: 3,
          py: 1,
          textAlign: "center",
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Plan Your Perfect Itinerary
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Select the types of places you'd love to explore in Mauritius. Based
          on your preferences, our VoyageAI will suggest ideal destinations
          tailored just for you.
        </Typography>
        <Divider sx={{ my: 4 }} />
      </Box>
      <ChipList />
      <Box sx={{ marginLeft: "46%", marginTop: "10%" }}>
        <Button variant="contained" color="primary" size="large">
          Generate
        </Button>
      </Box>
    </>
  ) : (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        marginLeft: "18%",
        marginRight: "17%",
        marginTop: "1%",
        width: "auto",
        height: "83vh",
      }}
    >
      <ChatContainer chatMessages={chatMessages} />
      <div style={{ display: "flex", gap: "8px" }}>
        <TextField
          id="outlined-basic"
          label="Enter your message here"
          sx={{
            width: "auto",
            flexGrow: 1,
          }}
          multiline
          maxRows={3}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isLoading}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        ></TextField>
        <IconButton
          sx={{
            backgroundColor: "primary.main",
            color: "white",
            padding: "12px",
            borderRadius: "25%",
            "&:hover": {
              backgroundColor: "primary.dark",
            },
          }}
          onClick={handleSendMessage}
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <KeyboardReturn fontSize="large" />
          )}
        </IconButton>
      </div>
    </Box>
  );
}

export default IteneraryPlannerPage;
