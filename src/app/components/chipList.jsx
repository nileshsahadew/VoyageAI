"use client";
import { Chip, Box, Grid } from "@mui/material";
import { useState } from "react";

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

  const handleClick = (currentChip) => {
    setChipData(
      chipData.map((chip) =>
        chip.key === currentChip.key
          ? { ...chip, selected: !currentChip.selected }
          : chip
      )
    );
  };

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
        //   border: "1px solid red",
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
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default ChipList;
