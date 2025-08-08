"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  IconButton,
  AppBar,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import LuggageIcon from "@mui/icons-material/LuggageOutlined";
import { LocalOfferOutlined, Message } from "@mui/icons-material";
import { useUIStateContext } from "./UIStateContext";
import { useSession } from "next-auth/react";
import GoogleLoginButton from "./googleLoginButton";

function NavigationBar() {
  const pathname = usePathname();
  const { UXMode, setUXMode } = useUIStateContext();

  // status can be "loading", "authenticated", or "unauthenticated"
  // data contains the session object (or null)
  const { data: session, status } = useSession();

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

          {/* Home Icon - using Next.js Link component */}
          <Link href="/" passHref>
            <Tooltip title="Home">
              <IconButton
                sx={{
                  color: pathname === "/" ? "#2a2a2a" : "text.secondary",
                  transition: "color 0.3s",
                  "&:hover": {
                    color: "#2a2a2a",
                  },
                }}
              >
                <HomeIcon fontSize="large" />
              </IconButton>
            </Tooltip>
          </Link>

          {/* Show the disabled button while the session status is loading, to prevent hydration mismatch. */}
          {status !== "authenticated" ? (
            <Tooltip title="Itinerary">
              <span>
                <IconButton
                  sx={{
                    color: "text.secondary", // Style it to look disabled
                    "&:hover": {
                      color: "text.secondary", // Maintain disabled appearance on hover
                    },
                  }}
                  disabled
                >
                  <LuggageIcon fontSize="large" />
                </IconButton>
              </span>
            </Tooltip>
          ) : // Once the status is not loading, render the correct component based on session existence.
          session ? (
            <Link href="/itenerary-planner" passHref>
              <Tooltip title="Itinerary">
                <IconButton
                  sx={{
                    color:
                      pathname === "/itenerary-planner"
                        ? "#2a2a2a"
                        : "text.secondary",
                    transition: "color 0.3s",
                    "&:hover": {
                      color: "#2a2a2a",
                    },
                  }}
                >
                  <LuggageIcon fontSize="large" />
                </IconButton>
              </Tooltip>
            </Link>
          ) : (
            // If there's no session after loading, show the disabled button.
            <Tooltip title="Itinerary">
              <IconButton
                sx={{
                  color: "text.secondary", // Style it to look disabled
                  "&:hover": {
                    color: "text.secondary", // Maintain disabled appearance on hover
                  },
                }}
                disabled
              >
                <LuggageIcon fontSize="large" />
              </IconButton>
            </Tooltip>
          )}
        </div>

        <div style={{ display: "flex", columnGap: "10px" }}>
          {/* Conditional rendering for toggle buttons */}
          {pathname === "/itenerary-planner" && (
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

          <GoogleLoginButton />
        </div>
      </Toolbar>
    </AppBar>
  );
}

export default NavigationBar;
