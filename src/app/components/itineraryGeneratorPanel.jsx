"use client";
import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Slider,
} from "@mui/material";
import ItineraryFormModal from "./itineraryFormModal";

function ItineraryGeneratorPanel({
  selectedPreferences = [],
  onResetSelection,
  onPreviewOpen,
}) {
  const [itineraryFormModalVisible, setItineraryFormModalVisible] =
    useState(false);
  const [numberOfDays, setNumberOfDays] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedCount = useMemo(
    () => selectedPreferences.length,
    [selectedPreferences]
  );

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return timeStr;
  };

  const handleReset = () => {
    setError("");
    setSuccess("");
    // no local preview state
    setNumberOfDays(3);
    if (typeof onResetSelection === "function") onResetSelection();
  };

  const handleGenerate = async () => {
    setItineraryFormModalVisible(true);
  };

  const handleSubmit = async (itineraryDetails) => {
    if (selectedCount === 0) {
      setError(
        "Please select at least one preference to generate an itinerary."
      );
      return;
    }

    setIsGenerating(true);
    setError("");
    setSuccess("");

    try {
      const userInput =
        `I want to visit Mauritius and I'm interested in: ${selectedPreferences.join(
          ", "
        )}. Please create a detailed itinerary for ${numberOfDays} days.` +
        (itineraryDetails.bookTickets
          ? `Make sure to include arrival and departure from/to the airport since I will be booking tickets`
          : "") +
        `My transport of choice will be ${itineraryDetails.transport} and there will be ${itineraryDetails.numberOfPeople} people on the trip.`;

      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput,
          previewOnly: true,
          numberOfDays,
        }),
      });
      const raw = await response.text();
      let parsed = null;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch (_) {
        parsed = null;
      }
      if (!response.ok) {
        const message =
          (parsed && parsed.error) || raw || "Failed to generate itinerary";
        throw new Error(message);
      }
      if (!parsed || !Array.isArray(parsed.itinerary)) {
        throw new Error("No itinerary returned. Please try again.");
      }
      const result = parsed;
      if (typeof onPreviewOpen === "function") {
        onPreviewOpen({ itinerary: result.itinerary, numberOfDays });
      }
      setSuccess("");
    } catch (err) {
      setError(
        err.message || "An error occurred while generating the itinerary"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Days selector */}
      <Box sx={{ mt: 2, width: "100%", maxWidth: 600 }}>
        <Typography variant="subtitle1" gutterBottom>
          Trip length: {numberOfDays} day{numberOfDays !== 1 ? "s" : ""}
        </Typography>
        <Slider
          value={numberOfDays}
          onChange={(_, v) => setNumberOfDays(v)}
          step={1}
          min={1}
          max={10}
          marks={[
            { value: 1, label: "1" },
            { value: 3, label: "3" },
            { value: 5, label: "5" },
            { value: 7, label: "7" },
            { value: 10, label: "10" },
          ]}
          valueLabelDisplay="auto"
          aria-label="Number of days"
        />
      </Box>

      {/* Error and Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mt: 2, width: "100%", maxWidth: 400 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2, width: "100%", maxWidth: 400 }}>
          {success}
        </Alert>
      )}

      {/* Buttons */}
      <Box
        sx={{
          mt: 3,
          textAlign: "center",
          display: "flex",
          gap: 2,
          justifyContent: "center",
        }}
      >
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleReset}
          disabled={isGenerating}
          sx={{
            px: 3,
            py: 1.5,
            fontSize: "1rem",
            borderRadius: 2,
            transition: "all 0.2s ease-in-out",
          }}
        >
          Reset Selection
        </Button>

        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleGenerate}
          disabled={isGenerating || selectedCount === 0}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: "1.1rem",
            fontWeight: "bold",
            borderRadius: 2,
            boxShadow: 2,
            "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
            transition: "all 0.2s ease-in-out",
          }}
        >
          {isGenerating ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Generating...
            </>
          ) : (
            `Generate Itinerary ${
              selectedCount > 0 ? `(${selectedCount})` : ""
            }`
          )}
        </Button>
      </Box>
      <ItineraryFormModal
        open={itineraryFormModalVisible}
        handleClose={() => {
          setItineraryFormModalVisible(false);
        }}
        handleSubmit={handleSubmit}
        hideItineraryDurationOption={true}
        hideItineraryPreferencesOption={true}
      />
    </>
  );
}
//

export default ItineraryGeneratorPanel;
