import { Routes, Route, Link, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import IteneraryPlanner from "./IteneraryPlanner";
import Home from "./Home";
import { useAuth } from "./components/AuthProvider";
import NavigationBar from "./components/navigationBar";
import UIStateContext from "./components/UIStateContext";

function App() {
  const location = useLocation();
  const authData = useAuth();

  // Pop up when user access itenarary page for the first time
  if (localStorage.getItem("events") != null)
    localStorage.setItem("events", {
      messagingBarIntroduced: false,
    });

  return (
    <UIStateContext>
      <Box>
        <NavigationBar location={location} authData={authData} />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/itenerary-planner" element={<IteneraryPlanner />} />
        </Routes>
      </Box>
    </UIStateContext>
  );
}

export default App;
