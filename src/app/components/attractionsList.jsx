import React, { useState } from "react";
import {
  Button,
  Container,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Link,
} from "@mui/material";
import theme from "@/theme";
import StarIcon from "@mui/icons-material/Star";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import IconButton from "@mui/material/IconButton";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

export default function AttractionsList({ attractions, ...props }) {
  const [currentDateIndex, setCurrentDateIndex] = React.useState(0);
  const [expanded, setExpanded] = React.useState(false);

  const groupAttractionsByDate = (attractionsArray) => {
    if (!Array.isArray(attractionsArray)) {
      console.error("Input is not a valid array:", attractionsArray);
      return {}; // Return an empty object to prevent the app from crashing.
    }

    const groupedData = attractionsArray.reduce(
      (accumulator, currentAttraction) => {
        const date = currentAttraction.date;

        if (!accumulator[date]) {
          accumulator[date] = [];
        }

        accumulator[date].push(currentAttraction);

        return accumulator;
      },
      {}
    );

    return groupedData;
  };

  // Function to create a valid Date object from the YYYY-MM-DD string
  const createDateObject = (dateString) => {
    const [year, month, day] = dateString.split("-");
    // Month is 0-indexed in JavaScript's Date constructor
    return new Date(year, month - 1, day);
  };

  const handleNextDate = () => {
    setCurrentDateIndex((prevIndex) => (prevIndex + 1) % dates.length);
    setExpanded(false); // Close accordions when navigating
  };

  const handlePrevDate = () => {
    setCurrentDateIndex(
      (prevIndex) => (prevIndex - 1 + dates.length) % dates.length
    );
    setExpanded(false); // Close accordions when navigating
  };

  const handleChange = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  const test = [
    {
      attraction_name: "Aapravasi Ghat World Heritage Site",
      date: "2025-08-19",
      day: "Tuesday",
      description:
        "UNESCO site marking the landing point of indentured laborers; museum exhibits and preserved structures on the harbor edge.",
      hour: "09:00 AM",
      location: "Port Louis, Mauritius",
      rating: 4.4,
      region: "Port Louis",
      url: "https://maps.app.goo.gl/GmWqXx3A8v8UUq4c6",
    },
    {
      attraction_name: "Odysseo – Oceanarium",
      date: "2025-08-19",
      day: "Tuesday",
      description:
        "Modern oceanarium with Indian Ocean species, walkthrough tunnels, and educational exhibits beside the harbor.",
      hour: "11:00 AM",
      location: "Les Salines, Port Louis, Mauritius",
      rating: 4.2,
      region: "Port Louis",
      url: "https://maps.google.com/?q=Odysseo+Oceanarium+Mauritius",
    },
    {
      attraction_name: "Rajiv Gandhi Science Center",
      date: "2025-08-19",
      day: "Tuesday",
      description:
        "Interactive science museum with hands-on exhibits, planetarium-style shows, and student workshops.",
      hour: "02:00 PM",
      location: "Bell Village, Port Louis, Mauritius",
      rating: 4.2,
      region: "Port Louis",
      url: "https://maps.google.com/?q=Rajiv+Gandhi+Science+Centre+Mauritius",
    },
    {
      attraction_name: "Champ de Mars Racecourse",
      date: "2025-08-19",
      day: "Tuesday",
      description:
        "Historic racecourse (since 1812) ringed by mountains—Saturday races draw big crowds and vibrant atmosphere.",
      hour: "04:00 PM",
      location: "Port Louis, Mauritius",
      rating: 4.2,
      region: "Port Louis",
      url: "https://maps.google.com/?q=Champ+de+Mars+Racecourse+Mauritius",
    },
    {
      attraction_name: "Château de Labourdonnais",
      date: "2025-08-20",
      day: "Wednesday",
      description:
        "A beautifully restored 19th-century colonial mansion and former agricultural estate, the Château de Labourdonnais offers visitors a journey back in time. The attraction encompasses a museum within the elegant home, extensive fruit orchards and gardens, a rum distillery, and a fine dining restaurant, making it a comprehensive cultural, historical, and gastronomic experience.",
      hour: "09:30 AM",
      location: "Mapou, Mauritius",
      rating: 4.5,
      region: "Riviere du Rempart",
      url: "https://maps.app.goo.gl/9oboEeqzJ1RUshJd6",
    },
    {
      attraction_name: "Roche Noire Lava Tubes",
      date: "2025-08-20",
      day: "Wednesday",
      description:
        "A unique geological site featuring a network of interconnected lava tubes formed by ancient volcanic activity. The caves offer a self-guided adventure through winding tunnels and chambers, showcasing impressive rock formations and providing a cool, dark escape from the tropical heat. This national reserve is a vital habitat for native wildlife, including the Mascarene swiftlets and the endangered Natal free-tailed bat.",
      hour: "01:30 PM",
      location: "Roche Noire, Mauritius",
      rating: 4.2,
      region: "Rivière du Rempart",
      url: "https://maps.app.goo.gl/aZ9YNLUerAMEEX3U7",
    },
    {
      attraction_name: "Bassin Tower",
      date: "2025-08-20",
      day: "Wednesday",
      description:
        "A historic tower offering panoramic views of the surrounding area, including the coastal lagoons and lush vegetation of the east.",
      hour: "04:00 PM",
      location: "Near Bras D'Eau, Flacq",
      rating: 4.7,
      region: "Northeast",
      url: "https://maps.google.com/?q=Bassin+Tower+Mauritius",
    },
  ];
  const [groupedAttractions, setGroupedAttractions] = useState(
    groupAttractionsByDate(attractions)
  );
  const dates = Object.keys(groupedAttractions);
  const currentDate = dates[currentDateIndex];
  const attractionsForDay = groupedAttractions[currentDate];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        // py: 4,
        // px: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Container maxWidth="sm">
        {/* Header with date and navigation arrows */}
        <Card sx={{ mb: 4, textAlign: "center" }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <IconButton
                onClick={handlePrevDate}
                disabled={currentDateIndex === 0}
                aria-label="Previous Day"
                color="primary"
              >
                <ArrowBackIosNewIcon />
              </IconButton>
              <Typography
                variant="h6"
                component="div"
                sx={{ flexGrow: 1, fontWeight: "bold" }}
              >
                {createDateObject(dates[currentDateIndex]).toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </Typography>
              <IconButton
                onClick={handleNextDate}
                disabled={currentDateIndex === dates.length - 1}
                aria-label="Next Day"
                color="primary"
              >
                <ArrowForwardIosIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>

        {/* List of Accordions for the selected date */}
        {attractionsForDay.length > 0 ? (
          attractionsForDay.map((attraction, index) => (
            <Accordion
              key={attraction.attraction_name}
              expanded={expanded === attraction.attraction_name}
              onChange={handleChange(attraction.attraction_name)}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel-${index}-content`}
                id={`panel-${index}-header`}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", width: "100%" }}
                >
                  <Typography sx={{ flexGrow: 1, fontWeight: "medium" }}>
                    {attraction.attraction_name}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <StarIcon
                      sx={{ color: "#FFD700", fontSize: "1.2rem", mr: 0.5 }}
                    />
                    <Typography variant="body2">{attraction.rating}</Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {attraction.description}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Chip
                      icon={<AccessTimeIcon />}
                      label={`Time: ${attraction.hour}`}
                      color="info"
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      icon={<PlaceIcon />}
                      label={`Location: ${attraction.location}`}
                      color="info"
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      icon={<TravelExploreIcon />}
                      label={`Region: ${attraction.region}`}
                      color="info"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  <Link
                    href={attraction.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textDecoration: "none" }}
                  >
                    <Chip
                      label="View on Map"
                      color="primary"
                      variant="filled"
                      sx={{
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: theme.palette.primary.dark,
                        },
                      }}
                    />
                  </Link>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))
        ) : (
          <Typography variant="body1" color="text.secondary" align="center">
            No attractions for this day.
          </Typography>
        )}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 4,
            gap: 2,
          }}
        >
          {props.children}
        </Box>
      </Container>
    </Box>
  );
}
