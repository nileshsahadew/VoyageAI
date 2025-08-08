"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";

function AuthCheckWrapper({ children }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      if (pathname === "/itenerary-planner") {
        router.push("/");
      }
    }
  }, [status, pathname]);

  // Show a spinner while the session is being checked.
  // This prevents the page from rendering until we know the status.
  if (status === "loading") {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Once authenticated, render the children (the page content)
  return <>{children}</>;
}

export default AuthCheckWrapper;
