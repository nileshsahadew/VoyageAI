"use client";
import { Chip, Box, Grid } from "@mui/material";
import { useMemo, useState } from "react";
import ItineraryGeneratorPanel from "./itineraryGeneratorPanel";

function ChipList({ onPreviewOpen }) {
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

  // Generation state is handled by ItineraryGeneratorPanel

  const handleClick = (currentChip) => {
    setChipData(
      chipData.map((chip) =>
        chip.key === currentChip.key
          ? { ...chip, selected: !currentChip.selected }
          : chip
      )
    );
  };

  const getSelectedPreferences = () => {
    return chipData
      .filter((chip) => chip.selected)
      .map((chip) =>
        chip.label.replace(/[🏖️🌊🏞️🏛️💎🎧🛍️🦜🚤🌅🛕🎭]/g, "").trim()
      );
  };

  const selectedPreferences = useMemo(
    () => getSelectedPreferences(),
    [chipData]
  );

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

      {/* Generator Panel */}
      <ItineraryGeneratorPanel
        selectedPreferences={selectedPreferences}
        onResetSelection={() =>
          setChipData(chipData.map((chip) => ({ ...chip, selected: false })))
        }
        onPreviewOpen={onPreviewOpen}
      />
    </Box>
  );
}

export default ChipList;
