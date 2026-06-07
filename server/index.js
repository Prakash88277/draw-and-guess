/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Entry point for the backend server. Sets up Express, Socket.io, CORS, and starts listening.
 * 
 * Functions inside: None (execution entry point)
 * 
 * Dependencies:
 * - express
 * - http
 * - socket.io
 * - cors
 * - dotenv
 * - server/socketHandlers.js
 * 
 * Dependents: None (root entry)
 * 
 * Current state: complete
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { registerSocketHandlers } = require('./socketHandlers');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

registerSocketHandlers(io);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
