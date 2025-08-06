import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Box, IconButton, AppBar, Toolbar, Tooltip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LuggageIcon from '@mui/icons-material/LuggageOutlined';
import IteneraryPlanner from './IteneraryPlanner';
import Home from './Home';

function App() {
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/', icon: <HomeIcon fontSize='large'/> },
    { label: 'Itinerary', path: '/itenerary-planner', icon: <LuggageIcon fontSize='large'/> },
  ];

  return (
    <Box>
      <AppBar
        position="static"
        elevation={0}
        color="default"
        sx={{
          // borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
          width: '100vw'
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            gap: 2,
            px: 4,
            py: 1.5,
          }}
        >
          <span style={{font: 'bolder', fontSize: '20px'}}> VoyageAI </span>
          {navItems.map((item) => (
            <Tooltip title={item.label} key={item.path}>
              <IconButton
                component={Link}
                to={item.path}
                sx={{
                  color:
                    location.pathname === item.path
                      ? '#2a2a2a'
                      : 'text.secondary',
                  transition: 'color 0.3s',
                  '&:hover': {
                    color: '#2a2a2a',
                  },
                }}
              >
                {item.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/itenerary-planner" element={<IteneraryPlanner />} />
      </Routes>
    </Box>
  );
}

export default App;
