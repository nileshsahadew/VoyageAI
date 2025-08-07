import {
  Button,
  Box,
  Typography,
  Divider,
  Paper,
  TextField,
  IconButton,
} from "@mui/material";
import ChipList from "./components/chipList";
import { useUIStateContext } from "./components/UIStateContext";
import { KeyboardReturn } from "@mui/icons-material";
import ChatContainer from "./components/chatContainer";
import { useEffect, useState } from "react";

function IteneraryPlanner() {
  const { UXMode, setUXMode } = useUIStateContext();
  const [chatMessages, setChatMessages] = useState([]);
  // useEffect(() => {
  //   // fetch chat messages
  //   const getChatMessages = async () => {};
  //   getChatMessages();
  // }, []);

  return UXMode.iteneraryAgentInterface !== "messaging" ? (
    <>
      <Box
        sx={{
          maxWidth: 900,
          mx: "auto",
          px: 3,
          py: 1,
          textAlign: "center",
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Plan Your Perfect Itinerary
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Select the types of places you'd love to explore in Mauritius. Based
          on your preferences, our VoyageAI will suggest ideal destinations
          tailored just for you.
        </Typography>
        <Divider sx={{ my: 4 }} />
      </Box>
      <ChipList />
      <Box sx={{ marginLeft: "46%", marginTop: "10%" }}>
        <Button variant="contained" color="primary" size="large">
          Generate
        </Button>
      </Box>
    </>
  ) : (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        marginLeft: "18%",
        marginRight: "17%",
        marginTop: "1%",
        width: "auto",
        height: "83vh",
        // border: "1px solid red",
      }}
    >
      <ChatContainer chatMessages={chatMessages} />
      <div style={{ display: "flex", gap: "8px" }}>
        <TextField
          id="outlined-basic"
          label="Enter your message here"
          sx={{
            width: "auto",
            flexGrow: 1,
          }}
          multiline
          maxRows={3}
        ></TextField>
        <IconButton
          sx={{
            backgroundColor: "primary.main",
            color: "white",
            padding: "12px",
            borderRadius: "25%",
            "&:hover": {
              backgroundColor: "primary.dark", // A darker shade on hover
            },
          }}
        >
          <KeyboardReturn fontSize="large"></KeyboardReturn>
        </IconButton>
      </div>
    </Box>
  );
}

export default IteneraryPlanner;
