import { Button, Box, Typography, Divider } from "@mui/material";
import ChipList from "./components/chipList";

function IteneraryPlanner() {
  return (
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
      <Box mt={6} sx={{ marginLeft: "46%", marginTop: "10%" }}>
        <Button variant="contained" color="primary" size="large">
          Generate
        </Button>
      </Box>
    </>
  );
}

export default IteneraryPlanner;
