import { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Box,
  IconButton,
  AppBar,
  Toolbar,
  Tooltip,
  Typography,
  Avatar,
  Button,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import LuggageIcon from "@mui/icons-material/LuggageOutlined";
import { useAuth } from "./AuthProvider"; // Assuming AuthProvider is in the same components folder
import { useGoogleLogin } from "@react-oauth/google"; // Import useGoogleLogin hook
import { LocalOfferOutlined, Message } from "@mui/icons-material";
import { useUIStateContext } from "./UIStateContext";

function NavigationBar() {
  // No props needed here, use useAuth hook directly
  const location = useLocation();
  const { token, user, logOut, handleGoogleSuccess, handleGoogleError } =
    useAuth();
  const { UXMode, setUXMode } = useUIStateContext();

  // Initialize the Google Login hook for implicit flow
  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
    flow: "implicit", // This is the critical change for frontend-only
    // Explicitly request scopes to ensure id_token is returned
    scope: "openid profile email",
  });

  return (
    <AppBar
      position="static"
      elevation={0}
      color="default"
      sx={{
        backgroundColor: "#ffffff",
        width: "100vw",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          px: 4,
          py: 1.5,
        }}
      >
        <div style={{ display: "flex", columnGap: "10px" }}>
          <Typography variant="h6" marginTop="10px">
            Auradrive Resorts
          </Typography>

          {/* Home Icon */}
          <Tooltip title="Home" key="/">
            <IconButton
              component={Link}
              to="/"
              sx={{
                color: location.pathname === "/" ? "#2a2a2a" : "text.secondary",
                transition: "color 0.3s",
                "&:hover": {
                  color: "#2a2a2a",
                },
              }}
            >
              <HomeIcon fontSize="large" />
            </IconButton>
          </Tooltip>

          {/* Itinerary Planner */}
          <Tooltip title="Itinerary" key="/itenerary-planner">
            <IconButton
              component={Link}
              to="/itenerary-planner"
              sx={{
                color:
                  location.pathname === "/itenerary-planner"
                    ? "#2a2a2a"
                    : "text.secondary",
                transition: "color 0.3s",
                "&:hover": {
                  color: "#2a2a2a",
                },
              }}
              disabled={!user}
            >
              <LuggageIcon fontSize="large" />
            </IconButton>
          </Tooltip>
        </div>

        <div style={{ display: "flex", columnGap: "10px" }}>
          {/* Show toggle between messaging bar and chipList in itenerary page */}
          {location.pathname === "/itenerary-planner" && (
            <>
              {UXMode.iteneraryAgentInterface !== "messaging" ? (
                <Tooltip title="Toggle Messaging Bar">
                  <IconButton
                    sx={{
                      color: "text.secondary",
                      transition: "color 0.3s",
                      "&:hover": {
                        color: "#2a2a2a",
                      },
                    }}
                    onClick={() =>
                      setUXMode((prev) => ({
                        ...prev,
                        iteneraryAgentInterface: "messaging",
                      }))
                    }
                  >
                    <Message fontSize="large"></Message>
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Toggle Normal View">
                  <IconButton
                    sx={{
                      color: "text.secondary",
                      transition: "color 0.3s",
                      "&:hover": {
                        color: "#2a2a2a",
                      },
                    }}
                    onClick={() =>
                      setUXMode((prev) => ({
                        ...prev,
                        iteneraryAgentInterface: "normal",
                      }))
                    }
                  >
                    <LocalOfferOutlined fontSize="large"></LocalOfferOutlined>
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
          {/* Conditional rendering for Google Login/User Avatar & Logout */}
          {user ? (
            // If user is logged in, show avatar and logout button
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title={user.name || user.email}>
                <Avatar
                  alt={user.name || user.email}
                  src={user.picture || undefined}
                  sx={{ width: 40, height: 40 }}
                />
              </Tooltip>
              <Button
                variant="outlined"
                color="inherit"
                onClick={logOut}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  borderColor: "#e0e0e0",
                  color: "text.primary",
                  "&:hover": {
                    borderColor: "#bdbdbd",
                    backgroundColor: "#f5f5f5",
                  },
                }}
              >
                Logout
              </Button>
            </Box>
          ) : (
            // If user is not logged in, show a custom button that triggers the googleLogin hook
            <Tooltip title="Sign in with Google">
              <Button
                variant="contained"
                onClick={() => googleLogin()} // Call the hook to initiate login
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  bgcolor: "#4285F4", // Google blue
                  "&:hover": {
                    bgcolor: "#357ae8",
                  },
                }}
              >
                Sign in
              </Button>
            </Tooltip>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
}

export default NavigationBar;
