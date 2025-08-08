import { Tooltip, IconButton, Link } from "@mui/material";
import LuggageIcon from "@mui/icons-material/LuggageOutlined";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

function IteneraryPageButton() {
  // status can be "loading", "authenticated", or "unauthenticated"
  // data contains the session object (or null)
  const { data: session, status } = useSession();
  const pathname = usePathname();

  /* Show the disabled button while the session status is loading, to prevent hydration mismatch. */
  return status !== "authenticated" ? (
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
  );
}

export default IteneraryPageButton;
