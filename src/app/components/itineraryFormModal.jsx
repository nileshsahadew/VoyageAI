import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  Button,
  Stack,
  Divider,
} from "@mui/material";

// A modal component for users to input their itinerary preferences.
// This is a self-contained component that can be imported and controlled
// by a parent component.
export default function ItineraryFormModal({
  itineraryDetails,
  open,
  handleClose,
  handleSubmit,
  hideItineraryDurationOption,
  hideItineraryPreferencesOption,
}) {
  // State to manage the form data
  const [formData, setFormData] = useState({
    itineraryDuration: 1,
    numberOfPeople: 1,
    itineraryPreferences: "",
    bookTickets: false,
    transport: "Taxi",
  });
  useEffect(() => {
    setFormData({
      itineraryDuration: itineraryDetails?.itineraryDuration || 1,
      numberOfPeople: itineraryDetails?.numberOfPeople || 1,
      itineraryPreferences: itineraryDetails?.itineraryPreferences || "",
      bookTickets: itineraryDetails?.bookTickets || false,
      transport: itineraryDetails?.transport || "Taxi",
    });
  }, [itineraryDetails]);

  // Handle changes to form inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle form submission
  const onSubmit = () => {
    // You can perform validation or other actions here
    handleSubmit(formData);
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="itinerary-modal-title"
      aria-describedby="itinerary-modal-description"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 500 },
          // The modal will now have a top margin of 50px
          marginTop: "5px",
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <Typography
          id="itinerary-modal-title"
          variant="h6"
          component="h2"
          align="center"
        >
          Plan Your Itinerary
        </Typography>
        <Divider />

        {/* Itinerary Duration (days) */}
        {!hideItineraryDurationOption && (
          <FormControl fullWidth>
            <InputLabel id="duration-label">
              Itinerary Duration (days)
            </InputLabel>
            <Select
              labelId="duration-label"
              id="duration-select"
              value={formData.itineraryDuration}
              label="Itinerary Duration (days)"
              onChange={handleChange}
              name="itineraryDuration"
            >
              {[...Array(7)].map((_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {i + 1} day{i > 0 && "s"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Number of People */}
        <TextField
          id="number-of-people"
          label="Number of People"
          type="number"
          fullWidth
          variant="outlined"
          name="numberOfPeople"
          value={formData.numberOfPeople}
          onChange={handleChange}
          inputProps={{ min: 1 }}
        />

        {/* Itinerary preferences (textbox) */}
        {!hideItineraryPreferencesOption && (
          <TextField
            id="preferences-textbox"
            label="Itinerary preferences"
            multiline
            rows={1}
            fullWidth
            variant="outlined"
            name="itineraryPreferences"
            value={formData.itineraryPreferences}
            onChange={handleChange}
          />
        )}

        {/* Book flight tickets (checkbox) */}
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.bookTickets}
              onChange={handleChange}
              name="bookTickets"
            />
          }
          label="Book flight tickets"
        />

        {/* Transport (radio buttons) */}
        <FormControl component="fieldset">
          <FormLabel component="legend">Transport</FormLabel>
          <RadioGroup
            row
            aria-label="transport"
            name="transport"
            value={formData.transport}
            onChange={handleChange}
          >
            <FormControlLabel value="Taxi" control={<Radio />} label="Taxi" />
            <FormControlLabel value="Bus" control={<Radio />} label="Bus" />
            <FormControlLabel value="Other" control={<Radio />} label="Other" />
          </RadioGroup>
        </FormControl>

        {/* Buttons for form actions */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={onSubmit}>
            Submit
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}
