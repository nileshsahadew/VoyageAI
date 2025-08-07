import { useState, createContext, useContext } from "react";

const _UIStateContext = createContext();

function UIStateContext({ children }) {
  const [UXMode, setUXMode] = useState({
    iteneraryAgentInterface: "chipList",
  });

  return (
    <_UIStateContext value={{ UXMode, setUXMode }}>{children}</_UIStateContext>
  );
}

export function useUIStateContext() {
  return useContext(_UIStateContext);
}

export default UIStateContext;
