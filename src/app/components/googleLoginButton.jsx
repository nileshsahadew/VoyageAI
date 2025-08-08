"use client";
import { Box, Button, Tooltip, Avatar, CircularProgress } from "@mui/material";
import { useSession, signIn, signOut } from "next-auth/react";

function GoogleLoginButton() {
  // Use the useSession hook from next-auth/react
  // status can be "loading", "authenticated", or "unauthenticated"
  // data contains the session object (or null)
  const { data: session, status } = useSession();
  const loading = status === "loading";

  /* Conditional rendering for Google Login/User Avatar & Logout */
  return loading ? (
    <CircularProgress size={40} sx={{ mt: 1 }} />
  ) : session ? (
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
