/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Registers all Socket.io event listeners. Acts as the bridge between client events and server logic.
 * 
 * Functions inside:
 * - registerSocketHandlers(io): Attaches connection and all custom event listeners to the Socket.io server instance.
 * 
 * Dependencies:
 * - server/roomManager.js
 * - server/gameEngine.js
 * 
 * Dependents:
 * - server/index.js
 * 
 * Current state: complete
 */

const roomManager = require('./roomManager');
const gameEngine = require('./gameEngine');

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    
    socket.on('room:create', (payload) => {
      const { playerName, avatar, settings } = payload;
      const room = roomManager.createRoom(socket.id, playerName, avatar, settings);
      socket.join(room.id);
      socket.emit('room:created', { roomId: room.id, room });
    });

    socket.on('room:join', (payload) => {
      const { roomId, playerName, avatar } = payload;
      const result = roomManager.joinRoom(roomId, socket.id, playerName, avatar);
      
      if (result.success) {
        socket.join(roomId);
        socket.emit('room:joined', result.room);
        io.to(roomId).emit('room:updated', result.room.players);
        
        // Send canvas history to the new joiner
        socket.emit('canvas:history', result.room.gameState.canvasStrokes);
      } else {
        socket.emit('error', result.reason);
      }
    });

    socket.on('room:leave', () => {
      const result = roomManager.leaveRoom(socket.id);
      if (result) {
        socket.leave(result.roomId);
        io.to(result.roomId).emit('room:updated', result.room.players);
      }
    });

    socket.on('game:start', () => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      if (room.ownerId !== socket.id) return;
      if (room.players.length < 2) return; // Need at least 2 players

      gameEngine.startGame(io, room.id);
    });

    socket.on('canvas:draw', (payload) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      roomManager.saveCanvasStroke(room.id, payload);
      socket.to(room.id).emit('canvas:draw', payload);
    });

    socket.on('canvas:clear', () => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      roomManager.clearCanvasHistory(room.id);
      socket.to(room.id).emit('canvas:clear');
    });

    socket.on('word:chosen', (payload) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      const drawer = room.players[room.gameState.currentDrawerIndex];
      if (!drawer || drawer.id !== socket.id) return;

      const { wordSelectionTimers } = require('./gameEngine');
      if (wordSelectionTimers.has(room.id)) {
        clearTimeout(wordSelectionTimers.get(room.id));
        wordSelectionTimers.delete(room.id);
      }

      gameEngine.beginDrawing(io, room.id, payload.word);
    });

    socket.on('chat:message', (payload) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      const isDrawer = player.isDrawing;
      const hasGuessed = player.hasGuessed;
      const isPlaying = room.gameState.status === 'playing';
      const word = room.gameState.currentWord;

      if (isPlaying && !hasGuessed && !isDrawer && word) {
        if (payload.message.toLowerCase() === word.toLowerCase()) {
          gameEngine.handleCorrectGuess(io, room.id, socket.id, player.name);
          return;
        }
      }

      // Default chat broadcast
      io.to(room.id).emit('chat:message', {
        playerName: player.name,
        message: payload.message,
        type: 'chat'
      });
    });

    socket.on('disconnect', () => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (room) {
        const player = room.players.find(p => p.id === socket.id);
        const wasDrawing = player && player.isDrawing;

        const result = roomManager.leaveRoom(socket.id);
        if (result) {
          io.to(result.roomId).emit('room:updated', result.room.players);
          
          if (wasDrawing && result.room.gameState.status === 'playing') {
            gameEngine.endTurn(io, result.roomId);
          }
        }
      }
    });

  });
}

module.exports = { registerSocketHandlers };
