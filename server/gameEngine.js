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
const wordSelectionTimers = new Map(); // Store timeout IDs for word selection phase

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
  room.gameState.currentWord = null;
  roomManager.resetGuessFlags(roomId);
  roomManager.clearCanvasHistory(roomId);
  io.to(roomId).emit('canvas:clear');
  
  room.gameState.turnStartScores = {};
  room.players.forEach(p => {
    room.gameState.turnStartScores[p.id] = p.score;
  });

  const words = getRandomWords(room.settings.wordCount || 3);
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
  
  // Sync reset player states (hasGuessed, isDrawing) to all clients
  io.to(roomId).emit('room:updated', room.players);
  
  // Send words only to drawer
  io.to(drawer.id).emit('word:choices', words);

  // Clear any existing word selection timer for this room
  if (wordSelectionTimers.has(roomId)) {
    clearTimeout(wordSelectionTimers.get(roomId));
    wordSelectionTimers.delete(roomId);
  }

  // Auto-skip turn after 15 seconds if drawer doesn't choose
  const autoTimer = setTimeout(() => {
    const room = roomManager.getRoomById(roomId);
    if (room && room.gameState.currentWord === null) {
      console.log(`[Auto] No word chosen in room ${roomId}, skipping turn.`);
      const currentDrawer = room.players[room.gameState.currentDrawerIndex];
      
      io.to(roomId).emit('message', { 
        text: `${currentDrawer ? currentDrawer.name : 'The drawer'} took too long to choose a word. Turn skipped!`, 
        type: 'system' 
      });
      
      if (currentDrawer) {
        currentDrawer.isDrawing = false;
      }
      
      nextTurn(io, roomId);
    }
    wordSelectionTimers.delete(roomId);
  }, 15000);

  wordSelectionTimers.set(roomId, autoTimer);
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

  const numHints = room.settings.hints !== undefined ? room.settings.hints : 2;
  const drawTime = room.settings.drawTime;
  const hintIntervals = [];
  if (numHints > 0) {
    for (let i = 1; i <= numHints; i++) {
      hintIntervals.push(Math.floor(drawTime - (drawTime / (numHints + 1)) * i));
    }
  }
  
  let revealedIndices = [];
  let nonSpaceIndices = [];
  for(let i=0; i<chosenWord.length; i++) {
    if (chosenWord[i] !== ' ') nonSpaceIndices.push(i);
  }

  const timerId = setInterval(() => {
    room.gameState.timeLeft--;
    io.to(roomId).emit('timer:tick', room.gameState.timeLeft);

    if (hintIntervals.includes(room.gameState.timeLeft)) {
      let unrevealed = nonSpaceIndices.filter(idx => !revealedIndices.includes(idx));
      // Never reveal the last letter
      if (unrevealed.length > 1) {
        let randIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        revealedIndices.push(randIdx);
        
        let newHint = chosenWord.split('').map((char, i) => {
          if (char === ' ') return ' ';
          if (revealedIndices.includes(i)) return char;
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

  const pointsThisTurn = {};
  room.players.forEach(p => {
    pointsThisTurn[p.id] = p.score - (room.gameState.turnStartScores?.[p.id] || 0);
  });
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

  io.to(roomId).emit('turn:end', { word: room.gameState.currentWord });
  io.to(roomId).emit('turn:summary', {
    word: room.gameState.currentWord,
    scores: sortedPlayers,
    pointsThisTurn
  });

  setTimeout(() => {
    nextTurn(io, roomId);
  }, 5000);
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
  handleCorrectGuess,
  wordSelectionTimers
};
