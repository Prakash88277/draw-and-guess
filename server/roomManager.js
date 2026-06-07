/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Manages all active game rooms. Each room is stored in a `rooms` Map. This is the single source of truth for all room and player state.
 * 
 * Functions inside:
 * - createRoom(socketId, playerName, avatar, settings): Creates a new room and adds the owner.
 * - joinRoom(roomId, socketId, playerName, avatar): Adds a player to an existing room.
 * - leaveRoom(socketId): Removes a player from their current room and handles room reassignment/deletion.
 * - getRoomBySocketId(socketId): Finds the room a socket belongs to.
 * - getRoomById(roomId): Returns a room by its ID.
 * - updatePlayerScore(roomId, socketId, points): Adds points to a player's score.
 * - resetGuessFlags(roomId): Resets the hasGuessed flag for all players in a room.
 * - saveCanvasStroke(roomId, strokeData): Appends stroke data to the room's canvas history.
 * - clearCanvasHistory(roomId): Clears the room's canvas history.
 * 
 * Dependencies:
 * - uuid: to generate unique room IDs
 * 
 * Dependents:
 * - server/gameEngine.js
 * - server/socketHandlers.js
 * 
 * Current state: complete
 */

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const rooms = new Map();

function createRoom(socketId, playerName, avatar, settings) {
  const roomId = generateRoomCode();
  
  const room = {
    id: roomId,
    ownerId: socketId,
    players: [
      {
        id: socketId,
        name: playerName,
        avatar: avatar,
        score: 0,
        hasGuessed: false,
        isDrawing: false
      }
    ],
    settings: {
      maxPlayers: settings?.maxPlayers || 8,
      rounds: settings?.rounds || 3,
      drawTime: settings?.drawTime || 80,
      customWords: settings?.customWords || [],
      useCustomWordsOnly: settings?.useCustomWordsOnly || false,
      wordCount: settings?.wordCount || 3,
      hints: settings?.hints !== undefined ? settings?.hints : 2
    },
    gameState: {
      status: 'waiting',
      currentRound: 0,
      currentDrawerIndex: 0,
      currentWord: null,
      wordChoices: [],
      timeLeft: 0,
      canvasStrokes: [],
      turnEnding: false
    }
  };

  rooms.set(roomId, room);
  return room;
}

function joinRoom(roomId, socketId, playerName, avatar) {
  const room = rooms.get(roomId);
  
  if (!room) {
    return { success: false, reason: 'Room not found' };
  }
  
  if (room.gameState.status !== 'waiting') {
    return { success: false, reason: 'Game already in progress' };
  }
  
  if (room.players.length >= room.settings.maxPlayers) {
    return { success: false, reason: 'Room is full' };
  }

  // Check if player already exists
  if (room.players.find(p => p.id === socketId)) {
    return { success: false, reason: 'Player already in room' };
  }

  room.players.push({
    id: socketId,
    name: playerName,
    avatar: avatar,
    score: 0,
    hasGuessed: false,
    isDrawing: false
  });

  return { success: true, room };
}

function leaveRoom(socketId) {
  for (const [roomId, room] of rooms.entries()) {
    const playerIndex = room.players.findIndex(p => p.id === socketId);
    
    if (playerIndex !== -1) {
      room.players.splice(playerIndex, 1);
      
      if (room.players.length === 0) {
        rooms.delete(roomId);
      } else if (room.ownerId === socketId) {
        room.ownerId = room.players[0].id;
      }
      
      return { roomId, room };
    }
  }
  return null;
}

function getRoomBySocketId(socketId) {
  for (const room of rooms.values()) {
    if (room.players.find(p => p.id === socketId)) {
      return room;
    }
  }
  return null;
}

function getRoomById(roomId) {
  return rooms.get(roomId) || null;
}

function updatePlayerScore(roomId, socketId, points) {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  const player = room.players.find(p => p.id === socketId);
  if (player) {
    player.score += points;
    return player;
  }
  return null;
}

function resetGuessFlags(roomId) {
  const room = rooms.get(roomId);
  if (room) {
    room.players.forEach(p => {
      p.hasGuessed = false;
    });
  }
}

function saveCanvasStroke(roomId, strokeData) {
  const room = rooms.get(roomId);
  if (room) {
    room.gameState.canvasStrokes.push(strokeData);
  }
}

function clearCanvasHistory(roomId) {
  const room = rooms.get(roomId);
  if (room) {
    room.gameState.canvasStrokes = [];
  }
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomBySocketId,
  getRoomById,
  updatePlayerScore,
  resetGuessFlags,
  saveCanvasStroke,
  clearCanvasHistory
};
