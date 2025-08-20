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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Backdrop,
} from "@mui/material";
import ChipList from "../components/chipList";
import ItineraryGeneratorPanel from "../components/itineraryGeneratorPanel";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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
  const [attractions, setAttractions] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItinerary, setPreviewItinerary] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailsDraft, setDetailsDraft] = useState({
    itineraryDuration: 1,
    numberOfPeople: 1,
    transport: "Taxi",
    hasDisabledPerson: false,
    bookTickets: false,
  });
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
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
        inputMessageRef.current ||
        baseTextRef.current ||
        ""
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
        inputMessageRef.current ||
        baseTextRef.current ||
        ""
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
        "Content-Type": "application/json",
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
        const isFirstChunk = assistantMessage.message.length === 0;
        assistantMessage.message += chunk;
        setChatMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...assistantMessage };
          return newMessages;
        });
        // Speak the initial assistant response (e.g., vehicle recommendation)
        if (
          isFirstChunk &&
          UXMode.autoSpeakAssistant &&
          typeof window !== "undefined" &&
          "speechSynthesis" in window
        ) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(chunk);
            utterance.rate = 1;
            window.speechSynthesis.speak(utterance);
          } catch (_) {}
        }
      };

      const onItineraryJSONArrival = (attractions) => {
        setAttractions(attractions);
        setIsGeneratingItinerary(false);
        setUXMode((prev) => ({
          ...prev,
          iteneraryAgentInterface: "normal",
        }));
        assistantMessage.message = "List of attractions generated! Redirecting to itinerary...";
        setChatMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...assistantMessage };
          return newMessages;
        });
        if (
          UXMode.autoSpeakAssistant &&
          typeof window !== "undefined" &&
          "speechSynthesis" in window
        ) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(
              "Itinerary ready. Redirecting to your plan."
            );
            utterance.rate = 1;
            window.speechSynthesis.speak(utterance);
          } catch (_) {}
        }
        console.log("Attractions: ", attractions);
      };

      // SSEClient listens to response stream and will parse each valid arriving chunk
      // before executing the callback
      const sseClient = new SSEClient();
      sseClient.on("text", onNewTextArrival);
      sseClient.on("json-itinerary", onItineraryJSONArrival);
             sseClient.on("request-itinerary", (data) => {
         console.log("🎯 REQUEST-ITINERARY EVENT RECEIVED:", data);
         try {
           const parsed = typeof data === "string" ? JSON.parse(data) : data;
           console.log("🎯 Parsed data:", parsed);
           setDetailsDraft({
             itineraryDuration: Number(parsed?.itineraryDuration) || 1,
             numberOfPeople: Number(parsed?.numberOfPeople) || 1,
             transport: parsed?.transport && parsed.transport !== "null" ? String(parsed.transport) : "Taxi",
             hasDisabledPerson: !!parsed?.hasDisabledPerson,
             bookTickets: !!parsed?.bookTickets,
           });
         } catch (error) {
           console.log("🎯 Error parsing data:", error);
           setDetailsDraft({ itineraryDuration: 1, numberOfPeople: 1, transport: "Taxi", hasDisabledPerson: false, bookTickets: false });
         }
         // stop spinner and open the details dialog
         console.log("🎯 Setting showDetailsDialog to true");
         setIsGeneratingItinerary(false);
         setShowDetailsDialog(true);
       });
      sseClient.on("start", () => setIsGeneratingItinerary(true));
      sseClient.on("end", () => setIsGeneratingItinerary(false));
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
    // Clear current itinerary view and switch to messaging UI
    setAttractions([]);
    setUXMode((prev) => ({ ...prev, iteneraryAgentInterface: "messaging" }));
    setInputMessage("Regenerate the itinerary with the same preferences and days.");
    // ensure state applied before sending
    setTimeout(() => handleSendMessage(), 0);
  };

  const handleConfirm = async() => {
    console.log("Confirm button clicked!");

    try {
      // Step 1: Generate itinerary (get pdf + ics)
      const genRes = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerary: attractions }), // send itinerary array
      });
      const genData = await genRes.json();
      console.log("GenData: ", genData);

      // Step 2: Send email
      const res = await fetch("/api/send-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64: genData.pdfBase64,
          icsBase64: genData.icsBase64,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Itinerary sent successfully!");
      } else {
        alert("Failed to send itinerary: " + data.error);
      }
    } catch (err) {
      console.error("Confirm error:", err);
      alert("Something went wrong while sending itinerary");
    }
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
        <Box sx={{ display: previewOpen ? "none" : "block" }}>
          <ChipList
            onPreviewOpen={({ itinerary }) => {
              setPreviewItinerary(Array.isArray(itinerary) ? itinerary : []);
              setPreviewOpen(true);
            }}
          />
        </Box>

        <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="md">
          <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            🗺️ Your Generated Itinerary
            <IconButton onClick={() => setPreviewOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Here's a preview of your personalized Mauritius adventure plan:
            </Typography>
            {previewItinerary.map((item, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  {item.hour ? `${item.hour} — ` : ""}{item.attraction_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.date} • {item.day}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  📍 {item.location}{item.region ? `, ${item.region}` : ""}
                </Typography>
                {item.rating && (
                  <Typography variant="body2" color="text.secondary">
                    ⭐ Rating: {item.rating}/5
                  </Typography>
                )}
                {item.description && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {item.description}
                  </Typography>
                )}
                {item.url && (
                  <Button variant="outlined" size="small" href={item.url} target="_blank" sx={{ mt: 1 }}>
                    📍 View on Google Maps
                  </Button>
                )}
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button color="success" variant="outlined" onClick={() => {
              setPreviewOpen(false);
              setPreviewItinerary([]);
            }}>
              Regenerate
            </Button>
            <Button color="primary" variant="contained" onClick={handleConfirm}>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
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

        {/* Details dialog when agent requests more info */}
        <Dialog 
          open={showDetailsDialog} 
          onClose={() => setShowDetailsDialog(false)} 
          fullWidth 
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }
          }}
        >
          <DialogTitle sx={{ 
            textAlign: 'center', 
            pb: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '12px 12px 0 0',
            fontWeight: 'bold',
            fontSize: '1.25rem'
          }}>
            🗺️ Plan Your Itinerary
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
              Help us create your perfect Mauritius adventure
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 2 }}>
            <Box sx={{ display: 'grid', gap: 3 }}>
              {/* Trip Duration */}
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'text.primary' }}>
                  📅 Trip Duration
                </Typography>
                <TextField
                  type="number"
                  label="Number of days"
                  value={detailsDraft.itineraryDuration}
                  onChange={(e) => setDetailsDraft((d) => ({ ...d, itineraryDuration: Number(e.target.value) }))}
                  inputProps={{ min: 1, max: 30 }}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <TextField
                  type="number"
                  label="Number of people"
                  value={detailsDraft.numberOfPeople}
                  onChange={(e) => setDetailsDraft((d) => ({ ...d, numberOfPeople: Number(e.target.value) }))}
                  inputProps={{ min: 1, max: 50 }}
                  fullWidth
                  variant="outlined"
                />
              </Box>

              {/* Transport Options */}
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'text.primary' }}>
                  🚗 Transportation
                </Typography>
                <FormControl fullWidth>
                  <RadioGroup
                    value={detailsDraft.transport}
                    onChange={(e) => setDetailsDraft((d) => ({ ...d, transport: e.target.value }))}
                  >
                    <FormControlLabel 
                      value="Taxi" 
                      control={<Radio />} 
                      label="Taxi (Recommended for convenience)" 
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel 
                      value="Bus" 
                      control={<Radio />} 
                      label="Bus (Budget-friendly option)" 
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel 
                      value="Other" 
                      control={<Radio />} 
                      label="Other (Rental car, etc.)" 
                    />
                  </RadioGroup>
                </FormControl>
              </Box>

              {/* Additional Options */}
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'text.primary' }}>
                  ⚙️ Additional Services
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={detailsDraft.bookTickets} 
                      onChange={(e) => setDetailsDraft((d) => ({ ...d, bookTickets: e.target.checked }))}
                      sx={{ '&.Mui-checked': { color: '#667eea' } }}
                    />
                  }
                  label="Book flight tickets"
                  sx={{ mb: 1 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={detailsDraft.hasDisabledPerson}
                      onChange={(e) => setDetailsDraft((d) => ({ ...d, hasDisabledPerson: e.target.checked }))}
                      sx={{ '&.Mui-checked': { color: '#667eea' } }}
                    />
                  }
                  label="Travelling with a disabled person"
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
            <Button 
              onClick={() => setShowDetailsDialog(false)}
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                px: 3
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setShowDetailsDialog(false);
                const msg = `Here are the details: itineraryDuration=${detailsDraft.itineraryDuration}; numberOfPeople=${detailsDraft.numberOfPeople}; transport=${detailsDraft.transport}; hasDisabledPerson=${detailsDraft.hasDisabledPerson}; bookTickets=${detailsDraft.bookTickets}`;
                setIsGeneratingItinerary(true);
                handleSendMessage(msg);
              }}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                }
              }}
            >
              Generate Itinerary
            </Button>
          </DialogActions>
        </Dialog>
        <Backdrop open={isGeneratingItinerary} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress color="inherit" />
            <Typography variant="body1">Generating itinerary...</Typography>
          </Box>
        </Backdrop>
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
  // Default (selection) UI with chip list and generator panel + overlay preview
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
      <Box sx={{ display: previewOpen ? "none" : "block" }}>
        <ChipList onPreviewOpen={({ itinerary }) => {
          setPreviewItinerary(Array.isArray(itinerary) ? itinerary : []);
          setPreviewOpen(true);
        }} />
      </Box>
      {/* Generation controls are inside ChipList; no separate panel here */}

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          🗺️ Your Generated Itinerary
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Here's a preview of your personalized Mauritius adventure plan:
          </Typography>
          {previewItinerary.map((item, index) => (
            <Box key={`${item.attraction_name}-${item.date}-${item.hour}-${index}`} sx={{ mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                {item.hour ? `${item.hour} — ` : ""}{item.attraction_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.date} • {item.day}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                📍 {item.location}{item.region ? `, ${item.region}` : ""}
              </Typography>
              {item.rating && (
                <Typography variant="body2" color="text.secondary">
                  ⭐ Rating: {item.rating}/5
                </Typography>
              )}
              {item.description && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {item.description}
                </Typography>
              )}
              {item.url && (
                <Button variant="outlined" size="small" href={item.url} target="_blank" sx={{ mt: 1 }}>
                  📍 View on Google Maps
                </Button>
              )}
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button color="success" variant="outlined" onClick={() => {
            setPreviewOpen(false);
            setPreviewItinerary([]);
            setUXMode((prev) => ({ ...prev, iteneraryAgentInterface: "messaging" }));
            setInputMessage("Regenerate the itinerary with the same preferences and days.");
            setTimeout(() => handleSendMessage(), 0);
          }}>
            Regenerate
          </Button>
          <Button color="primary" variant="contained" onClick={handleConfirm}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default IteneraryPlannerPage;
