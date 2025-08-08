import { Tooltip, IconButton, Link } from "@mui/material";
import LuggageIcon from "@mui/icons-material/LuggageOutlined";
import { usePathname } from "next/navigation";
import { useUIStateContext } from "../../providers/UIStateContext";

function IteneraryPageButton() {
  // status can be "loading", "authenticated", or "unauthenticated"
  // data contains the session object (or null)
  const [UXMode, setUXMode] = useUIStateContext();
  const pathname = usePathname();

  /* Show the disabled button while the session status is loading, to prevent hydration mismatch. */
  return UXMode.showAuthenticatedFeatures ? (
    <Link href="/itenerary-planner">
      <Tooltip title="Itinerary">
        <IconButton
          sx={{
            color:
              pathname === "/itenerary-planner" ? "#2a2a2a" : "text.secondary",
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
  );
}

export default IteneraryPageButton;
