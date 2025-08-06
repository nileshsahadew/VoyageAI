import { Routes, Route, Link, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import IteneraryPlanner from "./IteneraryPlanner";
import Home from "./Home";
import { useAuth } from "./components/AuthProvider";
import { GoogleLogin } from "@react-oauth/google";
import NavigationBar from "./components/navigationBar";

function App() {
  const location = useLocation();
  const authData = useAuth();

  return (
    <Box>
      <NavigationBar location={location} authData={authData} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/itenerary-planner" element={<IteneraryPlanner />} />
      </Routes>
    </Box>
  );
}

export default App;
