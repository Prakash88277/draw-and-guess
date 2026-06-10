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
app.use(cors({
  origin: true,   // reflects request origin, works for all local IPs
  credentials: true
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl)
      if (!origin) return callback(null, true);
      // Allow localhost
      if (origin.includes('localhost')) return callback(null, true);
      // Allow any local network IP (192.168.x.x, 10.x.x.x, 172.x.x.x)
      if (origin.includes('192.168.') || 
          origin.includes('10.') || 
          origin.includes('172.')) return callback(null, true);
      // Allow production URL from env
      if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) 
        return callback(null, true);
      callback(null, true); // allow all for now (tighten in production)
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

registerSocketHandlers(io);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
