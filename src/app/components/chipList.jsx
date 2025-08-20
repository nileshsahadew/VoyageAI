"use client";
import { Chip, Box, Grid, Button, Typography, Alert, CircularProgress, Paper, Accordion, AccordionSummary, AccordionDetails, Slider } from "@mui/material";
import { useState } from "react";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function ChipList() {
  const [chipData, setChipData] = useState([
    { key: 0, label: "🏖️ Beaches", color: "sand", selected: false },
    { key: 1, label: "🌊 Water Sports", color: "teal", selected: false },
    { key: 3, label: "🏞️ Nature Trails", color: "olive", selected: false },
    { key: 4, label: "🏛️ Heritage Sites", color: "clay", selected: false },
    {
      key: 5,
      label: "💎 High-End Shopping",
      color: "graphite",
      selected: false,
    },
    { key: 6, label: "🎧 Nightlife", color: "clay", selected: false },
    { key: 7, label: "🛍️ Local Markets", color: "coral", selected: false },
    { key: 8, label: "🦜 Wildlife", color: "success", selected: false },
    { key: 9, label: "🚤 Catamaran Cruises", color: "neon", selected: false },
    { key: 10, label: "🌅 Scenic Views", color: "warning", selected: false },
    { key: 11, label: "🛕 Religious Places", color: "olive", selected: false },
    {
      key: 12,
      label: "🎭 Cultural Shows",
      color: "secondary",
      selected: false,
    },
  ]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedItinerary, setGeneratedItinerary] = useState(null);
  const [numberOfDays, setNumberOfDays] = useState(3);

  const handleClick = (currentChip) => {
    setChipData(
      chipData.map((chip) =>
        chip.key === currentChip.key
          ? { ...chip, selected: !currentChip.selected }
          : chip
      )
    );
    // Clear any previous messages when user makes new selections
    setError("");
    setSuccess("");
    setGeneratedItinerary(null);
  };

  const getSelectedPreferences = () => {
    return chipData
      .filter(chip => chip.selected)
      .map(chip => chip.label.replace(/[🏖️🌊🏞️🏛️💎🎧🛍️🦜🚤🌅🛕🎭]/g, '').trim());
  };

  const generateItinerary = async () => {
    const selectedPrefs = getSelectedPreferences();
    
    if (selectedPrefs.length === 0) {
      setError("Please select at least one preference to generate an itinerary.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setSuccess("");
    setGeneratedItinerary(null);

    try {
      const userInput = `I want to visit Mauritius and I'm interested in: ${selectedPrefs.join(', ')}. Please create a detailed itinerary with multiple days.`;
      
      // Use preview-only mode to avoid requiring email/SMTP
      const requestBody = {
        userInput: userInput,
        previewOnly: true,
        numberOfDays: numberOfDays,
      };
      
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate itinerary');
      }

      const result = await response.json();
      setSuccess("Itinerary preview generated below. Sign in to receive a PDF and calendar via email.");
      setGeneratedItinerary(result.itinerary);
      
      console.log('Generated itinerary:', result.itinerary);
      
    } catch (err) {
      setError(err.message || 'An error occurred while generating the itinerary');
      console.error('Itinerary generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr;
  };

  const selectedCount = chipData.filter(chip => chip.selected).length;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginLeft: "20%",
        marginRight: "15%",
        marginTop: "0px",
        gap: "1rem",
      }}
    >
      {/* Row 1: 4 items */}
      <Grid container spacing={2}>
        {chipData.slice(0, 4).map((chip, index) => (
          <Grid key={index}>
            <Chip
              label={chip.label}
              onClick={() => handleClick(chip)}
              variant={chip.selected ? "filled" : "outlined"}
              color={chip.color}
              sx={{
                fontSize: "1rem",
                padding: "0.2rem",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            />
          </Grid>
        ))}
      </Grid>

      {/* Row 2: 5 items */}
      <Grid container spacing={2}>
        {chipData.slice(4, 9).map((chip, index) => (
          <Grid key={index}>
            <Chip
              label={chip.label}
              onClick={() => handleClick(chip)}
              variant={chip.selected ? "filled" : "outlined"}
              color={chip.color}
              sx={{
                fontSize: "1rem",
                padding: "0.2rem",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            />
          </Grid>
        ))}
      </Grid>

      {/* Row 3: 4 items */}
      <Grid container spacing={2}>
        {chipData.slice(9, 12).map((chip, index) => (
          <Grid key={index}>
            <Chip
              label={chip.label}
              onClick={() => handleClick(chip)}
              variant={chip.selected ? "filled" : "outlined"}
              color={chip.color}
              sx={{
                fontSize: "1rem",
                padding: "0.2rem",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            />
          </Grid>
        ))}
      </Grid>

      {/* Days selector */}
      <Box sx={{ mt: 2, width: '100%', maxWidth: 600 }}>
        <Typography variant="subtitle1" gutterBottom>
          Trip length: {numberOfDays} day{numberOfDays !== 1 ? 's' : ''}
        </Typography>
        <Slider
          value={numberOfDays}
          onChange={(_, v) => setNumberOfDays(v)}
          step={1}
          min={1}
          max={10}
          marks={[{value:1,label:'1'}, {value:3,label:'3'}, {value:5,label:'5'}, {value:7,label:'7'}, {value:10,label:'10'}]}
          valueLabelDisplay="auto"
          aria-label="Number of days"
        />
      </Box>

      {/* Selection Summary */}
      {selectedCount > 0 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Selected: {selectedCount} preference{selectedCount !== 1 ? 's' : ''}
          </Typography>
          <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
            {getSelectedPreferences().join(', ')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Days: {numberOfDays}
          </Typography>
        </Box>
      )}

      {/* Error and Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mt: 2, width: '100%', maxWidth: 400 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mt: 2, width: '100%', maxWidth: 400 }}>
          {success}
        </Alert>
      )}

      {/* Generate Button */}
      <Box sx={{ mt: 3, textAlign: 'center', display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          color="secondary"
          size="large"
          onClick={() => {
            setChipData(chipData.map(chip => ({ ...chip, selected: false })));
            setError("");
            setSuccess("");
            setGeneratedItinerary(null);
            setNumberOfDays(3);
          }}
          disabled={isGenerating}
          sx={{
            px: 3,
            py: 1.5,
            fontSize: '1rem',
            borderRadius: 2,
            transition: 'all 0.2s ease-in-out',
          }}
        >
          Reset Selection
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={generateItinerary}
          disabled={isGenerating || selectedCount === 0}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            borderRadius: 2,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {isGenerating ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Generating...
            </>
          ) : (
            `Generate Itinerary ${selectedCount > 0 ? `(${selectedCount})` : ''}`
          )}
        </Button>
      </Box>
      
      {selectedCount === 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Select at least one preference to continue
        </Typography>
      )}

      {/* Generated Itinerary Display */}
      {generatedItinerary && generatedItinerary.length > 0 && (
        <Box sx={{ mt: 4, width: '100%', maxWidth: 800 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              🗺️ Your Generated Itinerary
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Here's a preview of your personalized Mauritius adventure plan:
            </Typography>
            
            {generatedItinerary.map((item, index) => (
              <Accordion key={index} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', minWidth: 80 }}>
                      {formatTime(item.hour)}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {item.attraction_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                      {item.date} • {item.day}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      📍 {item.location}{item.region ? `, ${item.region}` : ''}
                    </Typography>
                    {item.rating && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        ⭐ Rating: {item.rating}/5
                      </Typography>
                    )}
                    {item.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {item.description}
                      </Typography>
                    )}
                    {item.url && (
                      <Button
                        variant="outlined"
                        size="small"
                        href={item.url}
                        target="_blank"
                        sx={{ mt: 1 }}
                      >
                        📍 View on Google Maps
                      </Button>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                This is a preview. Log in to receive a PDF itinerary and calendar via email.
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default ChipList;
