/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Custom React hook that listens to all game-related socket events and maintains local game state.
 * 
 * Functions inside:
 * - useGameSocket(socket, roomId): Hook that sets up event listeners and returns game state.
 * 
 * Dependencies:
 * - react (useState, useEffect)
 * 
 * Dependents:
 * - client/src/pages/Room.jsx
 * 
 * Current state: complete
 */

import { useState, useEffect } from 'react';

export function useGameSocket(socket, roomId) {
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [currentDrawer, setCurrentDrawer] = useState(null);
  const [wordHint, setWordHint] = useState('');
  const [myWord, setMyWord] = useState('');
  const [wordChoices, setWordChoices] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [messages, setMessages] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [finalScores, setFinalScores] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const onRoomUpdated = (newPlayers) => setPlayers(newPlayers);
    
    const onTurnStart = (data) => {
      setGameStatus('playing');
      setCurrentDrawer(data.currentDrawer);
      setCurrentRound(data.currentRound);
      setTotalRounds(data.totalRounds);
      setWordHint('');
      setMyWord('');
      setWordChoices([]);
      
      setMessages(prev => [...prev, {
        playerName: 'System',
        message: `${data.currentDrawer.name} is choosing a word...`,
        type: 'system'
      }]);
    };

    const onWordChoices = (choices) => setWordChoices(choices);
    const onWordHint = (hint) => setWordHint(hint);
    
    const onDrawingStart = (data) => {
      setTimeLeft(data.timeLeft);
      setTotalTime(data.timeLeft);
      setWordChoices([]);
      setMessages(prev => [...prev, {
        playerName: 'System',
        message: `Drawing started!`,
        type: 'system'
      }]);
    };

    const onTimerTick = (time) => setTimeLeft(time);

    const onTurnEnd = (data) => {
      setMessages(prev => [...prev, {
        playerName: 'System',
        message: `The word was: ${data.word}`,
        type: 'system'
      }]);
    };

    const onGuessCorrect = (data) => {
      setMessages(prev => [...prev, {
        playerName: data.playerName,
        message: `guessed correctly!`,
        type: 'correct'
      }]);
    };

    const onScoreUpdate = (newPlayers) => setPlayers(newPlayers);

    const onChatMessage = (data) => {
      setMessages(prev => [...prev, data]);
    };

    const onGameOver = (scores) => {
      setGameStatus('ended');
      setFinalScores(scores);
    };

    socket.on('room:updated', onRoomUpdated);
    socket.on('turn:start', onTurnStart);
    socket.on('word:choices', onWordChoices);
    socket.on('word:hint', onWordHint);
    socket.on('drawing:start', onDrawingStart);
    socket.on('timer:tick', onTimerTick);
    socket.on('turn:end', onTurnEnd);
    socket.on('guess:correct', onGuessCorrect);
    socket.on('score:update', onScoreUpdate);
    socket.on('chat:message', onChatMessage);
    socket.on('game:over', onGameOver);

    return () => {
      socket.off('room:updated', onRoomUpdated);
      socket.off('turn:start', onTurnStart);
      socket.off('word:choices', onWordChoices);
      socket.off('word:hint', onWordHint);
      socket.off('drawing:start', onDrawingStart);
      socket.off('timer:tick', onTimerTick);
      socket.off('turn:end', onTurnEnd);
      socket.off('guess:correct', onGuessCorrect);
      socket.off('score:update', onScoreUpdate);
      socket.off('chat:message', onChatMessage);
      socket.off('game:over', onGameOver);
    };
  }, [socket]);

  const sendGuess = (message) => {
    if (socket && message.trim()) {
      socket.emit('chat:message', { message: message.trim() });
    }
  };

  const chooseWord = (word) => {
    if (socket) {
      setMyWord(word);
      socket.emit('word:chosen', { word });
    }
  };

  return {
    players,
    setPlayers,
    gameStatus,
    setGameStatus,
    currentDrawer,
    wordHint,
    myWord,
    wordChoices,
    timeLeft,
    totalTime,
    messages,
    currentRound,
    totalRounds,
    finalScores,
    sendGuess,
    chooseWord
  };
}
