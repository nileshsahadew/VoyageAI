"use client";
import { Box, Button, Tooltip, Avatar, CircularProgress } from "@mui/material";
import { signIn, signOut, useSession } from "next-auth/react";
import { useUIStateContext } from "../../providers/UIStateContext";

function GoogleLoginButton() {
  const [UXMode, setUXMode] = useUIStateContext();
  const { data: session } = useSession();

  /* Conditional rendering for Google Login/User Avatar & Logout */
  return UXMode.showAuthenticatedFeatures ? (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Tooltip title={session.user.name || session.user.email}>
        <Avatar
          alt={session.user.name || session.user.email}
          src={session.user.image || undefined}
          sx={{ width: 40, height: 40 }}
        />
      </Tooltip>
      <Button
        variant="outlined"
        color="inherit"
        onClick={() => signOut()} // Use the signOut function
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
    <Tooltip title="Sign in with Google">
      <Button
        variant="contained"
        onClick={() => signIn("google")} // Use the signIn function for the Google provider
        sx={{
          borderRadius: 2,
          textTransform: "none",
          bgcolor: "#4285F4",
          "&:hover": {
            bgcolor: "#357ae8",
          },
        }}
      >
        Sign in
      </Button>
    </Tooltip>
  );
}

export default GoogleLoginButton;
