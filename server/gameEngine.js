/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Controls the full game loop. Manages turn start/end, timer countdown, word selection phase, scoring calculation, and round progression.
 * 
 * Functions inside:
 * - startGame(io, roomId): Initializes game state and starts the first turn.
 * - startTurn(io, roomId): Handles word selection phase.
 * - beginDrawing(io, roomId, chosenWord): Starts the drawing timer and sets the active word.
 * - endTurn(io, roomId): Ends the drawing phase and reveals the word.
 * - nextTurn(io, roomId): Advances to the next player or next round.
 * - endGame(io, roomId): Handles game over logic and final scores.
 * - calculateScore(timeLeft, maxTime, totalGuessers, guessOrder): Computes points based on speed and order of guesses.
 * - handleCorrectGuess(io, roomId, socketId, playerName): Processes a correct guess and updates scores.
 * 
 * Dependencies:
 * - server/roomManager.js
 * - server/wordList.js
 * 
 * Dependents:
 * - server/socketHandlers.js
 * 
 * Current state: complete
 */

const roomManager = require('./roomManager');
const { getRandomWords, getWordForDisplay } = require('./wordList');

const timers = new Map(); // Store interval IDs keyed by roomId

function startGame(io, roomId) {
  const room = roomManager.getRoomById(roomId);
  if (!room) return;

  room.gameState.status = 'playing';
  room.gameState.currentRound = 1;
  room.gameState.currentDrawerIndex = 0;
  
  startTurn(io, roomId);
}

function startTurn(io, roomId) {
  const room = roomManager.getRoomById(roomId);
  if (!room) return;

  room.gameState.turnEnding = false;
  roomManager.resetGuessFlags(roomId);
  roomManager.clearCanvasHistory(roomId);

  const words = getRandomWords(3);
  room.gameState.wordChoices = words;
  
  // Reset all isDrawing flags, set current drawer
  room.players.forEach(p => p.isDrawing = false);
  const drawer = room.players[room.gameState.currentDrawerIndex];
  if (!drawer) {
    // Edge case if player left
    nextTurn(io, roomId);
    return;
  }
  drawer.isDrawing = true;

  io.to(roomId).emit('turn:start', { 
    currentDrawer: drawer, 
    currentRound: room.gameState.currentRound, 
    totalRounds: room.settings.rounds 
  });
  
  // Send words only to drawer
  io.to(drawer.id).emit('word:choices', words);

  // 15 seconds to pick a word
  let selectTimeLeft = 15;
  if (timers.has(roomId)) {
    clearInterval(timers.get(roomId));
  }
  
  const timerId = setInterval(() => {
    selectTimeLeft--;
    // We could emit a timer tick here for the select phase
    io.to(roomId).emit('timer:tick', selectTimeLeft);
    if (selectTimeLeft <= 0) {
      clearInterval(timers.get(roomId));
      timers.delete(roomId);
      // auto pick first word
      const autoWord = room.gameState.wordChoices[0];
      beginDrawing(io, roomId, autoWord);
    }
  }, 1000);
  timers.set(roomId, timerId);
}

function beginDrawing(io, roomId, chosenWord) {
  const room = roomManager.getRoomById(roomId);
  if (!room) return;

  if (timers.has(roomId)) {
    clearInterval(timers.get(roomId));
    timers.delete(roomId);
  }

  room.gameState.currentWord = chosenWord;
  room.gameState.timeLeft = room.settings.drawTime;
  
  const hint = getWordForDisplay(chosenWord);
  room.players.forEach(p => {
    if (!p.isDrawing) {
      io.to(p.id).emit('word:hint', hint);
    }
  });

  io.to(roomId).emit('drawing:start', { timeLeft: room.settings.drawTime });

  const timerId = setInterval(() => {
    room.gameState.timeLeft--;
    io.to(roomId).emit('timer:tick', room.gameState.timeLeft);

    // Send random letter hint if time < 20%
    if (room.gameState.timeLeft === Math.floor(room.settings.drawTime * 0.2)) {
      let chars = chosenWord.split('');
      let displayChars = hint.split(' '); // split by space to get each part since it's "char space char"
      // Wait, getWordForDisplay returns e.g. "_ _ _" -> split(' ') -> ["_", "_", "_"]
      // Actually it joins by " ". So `hint` is char combined. Let's just create a new hint.
      
      let unrevealed = [];
      for(let i=0; i<chars.length; i++) {
        if (chars[i] !== ' ') {
          unrevealed.push(i);
        }
      }
      if (unrevealed.length > 0) {
        let randIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        let newHint = chars.map((char, i) => {
          if (char === ' ') return ' ';
          if (i === randIdx) return char;
          return '_';
        }).join(' ');
        
        room.players.forEach(p => {
          if (!p.isDrawing) {
            io.to(p.id).emit('word:hint', newHint);
          }
        });
      }
    }

    if (room.gameState.timeLeft <= 0) {
      clearInterval(timers.get(roomId));
      timers.delete(roomId);
      endTurn(io, roomId);
    }
  }, 1000);
  timers.set(roomId, timerId);
}

function endTurn(io, roomId) {
  const room = roomManager.getRoomById(roomId);
  if (!room) return;

  if (room.gameState.turnEnding) return;
  room.gameState.turnEnding = true;

  if (timers.has(roomId)) {
    clearInterval(timers.get(roomId));
    timers.delete(roomId);
  }

  const drawer = room.players[room.gameState.currentDrawerIndex];
  if (drawer) {
    drawer.isDrawing = false;
  }

  io.to(roomId).emit('turn:end', { word: room.gameState.currentWord });

  setTimeout(() => {
    nextTurn(io, roomId);
  }, 3000);
}

function nextTurn(io, roomId) {
  const room = roomManager.getRoomById(roomId);
  if (!room) return;

  room.gameState.currentDrawerIndex++;
  
  if (room.gameState.currentDrawerIndex >= room.players.length) {
    room.gameState.currentRound++;
    room.gameState.currentDrawerIndex = 0;
  }

  if (room.gameState.currentRound > room.settings.rounds) {
    endGame(io, roomId);
  } else {
    startTurn(io, roomId);
  }
}

function endGame(io, roomId) {
  const room = roomManager.getRoomById(roomId);
  if (!room) return;

  room.gameState.status = 'ended';
  
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  io.to(roomId).emit('game:over', sortedPlayers);
}

function calculateScore(timeLeft, maxTime, totalGuessers, guessOrder) {
  const baseScore = 100;
  const timeBonus = Math.floor((timeLeft / maxTime) * 100);
  let orderBonus = 0;
  
  if (guessOrder === 0) orderBonus = 50;
  else if (guessOrder === 1) orderBonus = 30;
  else if (guessOrder === 2) orderBonus = 10;
  
  return baseScore + timeBonus + orderBonus;
}

function handleCorrectGuess(io, roomId, socketId, playerName) {
  const room = roomManager.getRoomById(roomId);
  if (!room) return;

  const player = room.players.find(p => p.id === socketId);
  if (!player) return;

  player.hasGuessed = true;

  const guessOrder = room.players.filter(p => p.hasGuessed && p.id !== socketId).length;
  
  const points = calculateScore(
    room.gameState.timeLeft,
    room.settings.drawTime,
    room.players.length - 1, 
    guessOrder
  );

  roomManager.updatePlayerScore(roomId, socketId, points);

  io.to(roomId).emit('guess:correct', { playerName });
  io.to(roomId).emit('score:update', room.players);

  const allGuessed = room.players.filter(p => !p.isDrawing).every(p => p.hasGuessed);
  if (allGuessed) {
    endTurn(io, roomId);
  }
}

module.exports = {
  startGame,
  startTurn,
  beginDrawing,
  endTurn,
  nextTurn,
  endGame,
  calculateScore,
  handleCorrectGuess
};
