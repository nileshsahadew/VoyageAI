// import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import IteneraryPlanner from './IteneraryPlanner';
import Home from './Home';
import './App.css';

function App() {
  return (
    <div id="navbar">
       <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/itenerary-planner">Itinerary Planner</Link>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<Home/>}></Route>
        <Route path="itenerary-planner" element={<IteneraryPlanner/>}></Route>
      </Routes>
    </div>
  )
}

export default App
