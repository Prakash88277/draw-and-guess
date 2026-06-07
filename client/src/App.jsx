/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Root component. Sets up React Router with three routes.
 * 
 * Functions inside:
 * - App(): Returns BrowserRouter containing Home, Room, and GameOver routes.
 * 
 * Dependencies:
 * - react-router-dom
 * - client/src/pages/Home.jsx
 * - client/src/pages/Room.jsx
 * - client/src/pages/GameOver.jsx
 * 
 * Dependents:
 * - client/src/main.jsx
 * 
 * Current state: complete
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';
import GameOver from './pages/GameOver';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/gameover" element={<GameOver />} />
      </Routes>
    </Router>
  );
}

export default App;
