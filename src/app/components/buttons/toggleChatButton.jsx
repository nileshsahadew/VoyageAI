import { Tooltip, IconButton } from "@mui/material";
import { LocalOfferOutlined, Message } from "@mui/icons-material";
import { useUIStateContext } from "../UIStateContext";

function ToggleChatButton() {
  const { UXMode, setUXMode } = useUIStateContext();

  /* Conditional rendering for toggle buttons */
  return UXMode.iteneraryAgentInterface !== "messaging" ? (
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
  );
}

export default ToggleChatButton;
