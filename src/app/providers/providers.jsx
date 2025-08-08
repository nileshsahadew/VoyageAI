"use client";

import { SessionProvider } from "next-auth/react";
import UIStateContext from "./UIStateContext";
import ThemeRegistry from "./ThemeRegistry";
import AuthCheckWrapper from "./AuthCheckWrapper";

// This is a client-side component that wraps your app
// with the <SessionProvider> to provide the session data.
export default function Providers({ children }) {
  return (
    <ThemeRegistry>
      <SessionProvider>
        <UIStateContext>
          <AuthCheckWrapper>{children}</AuthCheckWrapper>
        </UIStateContext>
      </SessionProvider>
    </ThemeRegistry>
  );
}
