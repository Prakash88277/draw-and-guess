/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Creates a single Socket.io-client instance shared across the entire React app.
 * 
 * Functions inside: None (exports socket instance)
 * 
 * Dependencies:
 * - socket.io-client
 * 
 * Dependents:
 * - client/src/hooks/useGameSocket.js
 * - client/src/hooks/useCanvas.js
 * - client/src/pages/Home.jsx
 * - client/src/pages/Room.jsx
 * 
 * Current state: complete
 */

import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const socket = io(URL, {
  autoConnect: false
});

export default socket;
