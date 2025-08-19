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
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ChatContainer from "../components/chatContainer";
import { useEffect, useRef, useState } from "react";
import SSEClient from "@/utils/sseClient";
import AttractionsList from "../components/attractionsList";

function IteneraryPlannerPage() {
  const [UXMode, setUXMode] = useUIStateContext();
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [attractions, setAttractions] = useState([1]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef("");
  const isLoadingRef = useRef(false);
  const autoSendRef = useRef(true);
  const silenceTimerRef = useRef(null);
  const isListeningRef = useRef(false);
  const inputMessageRef = useRef("");

  // Keep refs in sync with latest values to avoid stale closures in recognition callbacks
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    autoSendRef.current = !!UXMode.autoSendDictation;
  }, [UXMode.autoSendDictation]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    inputMessageRef.current = inputMessage;
  }, [inputMessage]);

  // Initialize SpeechRecognition when available
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    const resetSilenceTimer = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      // Stop listening after short silence, which triggers onend and auto-send
      silenceTimerRef.current = setTimeout(() => {
        try {
          recognition.stop();
        } catch (_) {}
      }, 2000);
    };

    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          baseTextRef.current += transcript + " ";
        } else {
          interimText += transcript;
        }
      }
      setInputMessage(baseTextRef.current + interimText);
      // Any result activity resets the silence timer
      resetSilenceTimer();
    };

    // In some browsers, speechend fires after a pause
    recognition.onspeechend = () => {
      resetSilenceTimer();
    };

    recognition.onend = () => {
      setIsListening(false);
      const finalText = (
        inputMessageRef.current || baseTextRef.current || ""
      ).trim();
      if (finalText && !isLoadingRef.current && autoSendRef.current) {
        handleSendMessage(finalText);
        baseTextRef.current = "";
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      const finalText = (
        inputMessageRef.current || baseTextRef.current || ""
      ).trim();
      if (finalText && !isLoadingRef.current && autoSendRef.current) {
        handleSendMessage(finalText);
        baseTextRef.current = "";
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    setSttSupported(true);

    return () => {
      try {
        recognition.stop();
      } catch (_) {}
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || isLoading) return;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    baseTextRef.current = inputMessageRef.current || "";
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (_) {
      // start can throw if called too quickly; ignore
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (_) {}
    setIsListening(false);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

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
  const handleSendMessage = async (messageOverride) => {
    const safeOverride =
      typeof messageOverride === "string" ? messageOverride : undefined;
    const messageToSend = safeOverride ?? inputMessage;
    // Prevent sending empty messages or while loading
    if (messageToSend.trim() === "" || isLoading) return;

    const userMessage = { type: "user", message: messageToSend };
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
      const onNewTextArrival = (chunk) => {
        assistantMessage.message += chunk;
        setChatMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...assistantMessage };
          return newMessages;
        });
      };

      const onItineraryJSONArrival = (attractions) => {
        setAttractions(attractions);
        setUXMode((prev) => ({
          ...prev,
          iteneraryAgentInterface: "normal",
        }));
        assistantMessage.message = "List of attractions generated!";
        setChatMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...assistantMessage };
          return newMessages;
        });
        console.log("Attractions: ", attractions);
      };

      // SSEClient listens to response stream and will parse each valid arriving chunk
      // before executing the callback
      const sseClient = new SSEClient();
      sseClient.on("text", onNewTextArrival);
      sseClient.on("json-itinerary", onItineraryJSONArrival);
      sseClient.on("end", () => {
        if (
          UXMode.autoSpeakAssistant &&
          typeof window !== "undefined" &&
          "speechSynthesis" in window
        ) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(
              assistantMessage.message
            );
            utterance.rate = 1;
            window.speechSynthesis.speak(utterance);
          } catch (_) {}
        }
      });
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

  // Placeholder functions for the new buttons
  const handleCancel = () => {
    setAttractions([]);
  };

  const handleRegenerate = () => {
    setAttractions([]);
    setInputMessage(
      "Generate a new itinerary with the same preferences and days."
    );
    handleSendMessage();
  };

  const handleConfirm = () => {
    console.log("Confirm button clicked!");
    // Add logic for confirming here
  };

  // The rest of the component will only render if the session is ready
  if (UXMode.iteneraryAgentInterface !== "messaging" && attractions.length == 0)
    return (
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
    );
  else if (UXMode.iteneraryAgentInterface === "messaging")
    return (
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
            id="chat-input"
            placeholder="Enter your message here"
            variant="outlined"
            sx={{
              width: "auto",
              flexGrow: 1,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#1f1f1f",
                color: "#f0f0f0",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#666666",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#888888",
              },
              "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#1976d2",
              },
              "& .MuiInputBase-input::placeholder": {
                color: "#c8c8c8",
                opacity: 1,
              },
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
              backgroundColor: isListening ? "#d32f2f" : "primary.main",
              color: "white",
              padding: "12px",
              borderRadius: "25%",
              "&:hover": {
                backgroundColor: isListening ? "#b71c1c" : "primary.dark",
              },
            }}
            onClick={isListening ? stopListening : startListening}
            disabled={!sttSupported || isLoading}
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
            title={
              !sttSupported
                ? "Speech-to-Text not supported in this browser"
                : isListening
                ? "Stop voice input"
                : "Start voice input"
            }
          >
            {isListening ? (
              <MicOffIcon fontSize="large" />
            ) : (
              <MicIcon fontSize="large" />
            )}
          </IconButton>
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
            onClick={() => handleSendMessage()}
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
  else if (
    UXMode.iteneraryAgentInterface !== "messaging" &&
    attractions.length > 0
  ) {
    return (
      <AttractionsList attractions={attractions}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleCancel}
          fullWidth
        >
          Cancel
        </Button>
        <Button
          variant="outlined"
          color="success"
          onClick={handleRegenerate}
          fullWidth
        >
          Regenerate
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConfirm}
          fullWidth
        >
          Confirm
        </Button>
      </AttractionsList>
    );
  }
}

export default IteneraryPlannerPage;
