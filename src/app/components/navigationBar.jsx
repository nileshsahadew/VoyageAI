"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconButton,
  AppBar,
  Toolbar,
  Tooltip,
  Typography,
  FormControlLabel,
  Switch,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import GoogleLoginButton from "./buttons/googleLoginButton";
import ToggleChatButton from "./buttons/toggleChatButton";
import IteneraryPageButton from "./buttons/iteneraryPageButton";

import { useUIStateContext } from "../providers/UIStateContext";

function NavigationBar() {
  const pathname = usePathname();
  const [UXMode, setUXMode] = useUIStateContext();

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
            AuraDrive Resort
          </Typography>

          {/* Home Page Navigation Button */}
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

          {/* Itenerary Page Navigation Button */}
          <IteneraryPageButton />
        </div>

        <div style={{ display: "flex", columnGap: "10px", alignItems: "center" }}>
          {pathname === "/itenerary-planner" && (
            <>
              <ToggleChatButton />
              <FormControlLabel
                control={
                  <Switch
                    checked={!!UXMode.autoSpeakAssistant}
                    onChange={(e) =>
                      setUXMode((prev) => ({
                        ...prev,
                        autoSpeakAssistant: e.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label="Auto TTS"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={!!UXMode.autoSendDictation}
                    onChange={(e) =>
                      setUXMode((prev) => ({
                        ...prev,
                        autoSendDictation: e.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label="Auto Send"
              />
            </>
          )}

          <GoogleLoginButton />
        </div>
      </Toolbar>
    </AppBar>
  );
}

export default NavigationBar;
