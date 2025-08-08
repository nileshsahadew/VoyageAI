import { createTheme } from "@mui/material/styles";

// This is your complete theme configuration with custom colors.
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
    // Vibrant Creative - Artistic & Bold
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

export default theme;