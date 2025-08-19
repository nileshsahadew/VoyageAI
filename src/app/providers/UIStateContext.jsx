"use client";
import { useSession } from "next-auth/react";
import { useState, createContext, useContext, useEffect } from "react";

const _UIStateContext = createContext();

function UIStateContext({ children }) {
  const { data: session, status } = useSession();
  const [UXMode, setUXMode] = useState({
    iteneraryAgentInterface: "chipList",
    showAuthenticatedFeatures: false,
    loadPage: false,
    autoSpeakAssistant: true,
    autoSendDictation: true,
  });

  useEffect(() => {
    if (status == "authenticated")
      setUXMode((prev) => ({
        ...prev,
        showAuthenticatedFeatures: true,
      }));
    else
      setUXMode((prev) => ({
        ...prev,
        showAuthenticatedFeatures: false,
        loadPage: status !== "loading",
      }));
  }, [status]);

  return (
    <_UIStateContext value={[UXMode, setUXMode]}>{children}</_UIStateContext>
  );
}

export function useUIStateContext() {
  return useContext(_UIStateContext);
}

export default UIStateContext;
