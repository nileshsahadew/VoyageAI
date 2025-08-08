import {
  Chip,
  createTheme,
  ListItem,
  Box,
  Paper,
  ThemeProvider,
  Grid,
} from "@mui/material";
import { useState } from "react";

function ChipList() {
  const theme = createTheme({
    palette: {
      // Warm organic tones - calm UIs
      sand: {
        main: "#D4B483",
        light: "#EAD8BA",
        dark: "#A07C4F",
        contrastText: "#3E3E3E",
      },
      clay: {
        main: "#A26769",
        light: "#C49A9D",
        dark: "#7C4B4F",
        contrastText: "#ffffff",
      },
      olive: {
        main: "#9A9E5E",
        light: "#C0C487",
        dark: "#6F733E",
        contrastText: "#ffffff",
      },
      // Modern Tech
      graphite: {
        main: "#2E2E2E",
        light: "#5A5A5A",
        dark: "#1C1C1C",
        contrastText: "#ffffff",
      },
      ice: {
        main: "#E6F0F4",
        light: "#F8FBFC",
        dark: "#B0C5CB",
        contrastText: "#1C1C1C",
      },
      neon: {
        main: "#00C6AE",
        light: "#4DE3D3",
        dark: "#009688",
        contrastText: "#ffffff",
      },
      //   Vibrant Creative - Artistic & Bold
      coral: {
        main: "#FF6B6B",
        light: "#FF9C9C",
        dark: "#CC5555",
        contrastText: "#ffffff",
      },
      lemon: {
        main: "#FFF685",
        light: "#FFFAB2",
        dark: "#CFC15A",
        contrastText: "#1C1C1C",
      },
      teal: {
        main: "#1DD3B0",
        light: "#61E4CD",
        dark: "#0D9E85",
        contrastText: "#ffffff",
      },
    },
  });

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
    <ThemeProvider theme={theme}>
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
    </ThemeProvider>
  );
}

export default ChipList;
