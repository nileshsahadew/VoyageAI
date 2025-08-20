"use client";
import { useEffect, useRef, useState } from "react";
import { Typography, Box, IconButton } from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopIcon from "@mui/icons-material/Stop";

//
function ChatContainer({ chatMessages }) {
  const containerRef = useRef(null);
  const currentUtteranceRef = useRef(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const ttsSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // Scroll to bottom when chatMessages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Cleanup any ongoing speech on unmount
  useEffect(() => {
    return () => {
      if (ttsSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [ttsSupported]);

  const stopSpeaking = () => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingIndex(null);
    currentUtteranceRef.current = null;
  };

  const speakText = (text, index) => {
    if (!ttsSupported) return;

    // Toggle stop if already speaking this message
    if (isSpeaking && speakingIndex === index) {
      stopSpeaking();
      return;
    }

    // Cancel any current speech before starting a new one
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtteranceRef.current = utterance;
    utterance.rate = 1;
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingIndex(null);
      currentUtteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingIndex(null);
      currentUtteranceRef.current = null;
    };

    setSpeakingIndex(index);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
              {msg.message}
            </Typography>
            {msg.type !== "user" && (
              <IconButton
                size="small"
                onClick={() =>
                  isSpeaking && speakingIndex === index
                    ? stopSpeaking()
                    : speakText(msg.message, index)
                }
                disabled={!ttsSupported}
                sx={{
                  ml: 1,
                  color: msg.type === "user" ? "white" : "black",
                }}
                aria-label={
                  isSpeaking && speakingIndex === index
                    ? "Stop speaking"
                    : "Speak message"
                }
                title={
                  !ttsSupported
                    ? "Text-to-Speech not supported in this browser"
                    : isSpeaking && speakingIndex === index
                    ? "Stop"
                    : "Speak"
                }
              >
                {isSpeaking && speakingIndex === index ? (
                  <StopIcon fontSize="small" />
                ) : (
                  <VolumeUpIcon fontSize="small" />
                )}
              </IconButton>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
export default ChatContainer;
