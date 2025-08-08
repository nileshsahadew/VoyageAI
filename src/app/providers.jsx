"use client";

import { SessionProvider } from "next-auth/react";
import UIStateContext from "./components/UIStateContext";
import ThemeRegistry from "./components/ThemeRegistry";

// This is a client-side component that wraps your app
// with the <SessionProvider> to provide the session data.
export default function Providers({ children }) {
  return (
    <SessionProvider>
      <UIStateContext>
        <ThemeRegistry>{children}</ThemeRegistry>
      </UIStateContext>
    </SessionProvider>
  );
}
