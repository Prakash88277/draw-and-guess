/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Main game page. Orchestrates all components together.
 * 
 * Functions inside:
 * - Room(): Renders the layout, passes state to Canvas, ChatBox, Timer, PlayerList.
 * 
 * Dependencies:
 * - react (useEffect)
 * - react-router-dom (useParams, useNavigate, useLocation)
 * - client/src/socket.js
 * - client/src/hooks/useGameSocket.js
 * - Components (Canvas, ChatBox, Timer, PlayerList)
 * 
 * Dependents:
 * - client/src/App.jsx
 * 
 * Current state: complete
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import socket from '../socket';
import { useGameSocket } from '../hooks/useGameSocket';
import Canvas from '../components/Canvas';
import ChatBox from '../components/ChatBox';
import Timer from '../components/Timer';
import PlayerList from '../components/PlayerList';
import { Copy, Check } from 'lucide-react';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  // Read player details from navigation state (set in Home.jsx)
  const playerName = location.state?.playerName;
  const avatar = location.state?.avatar;

  const {
    players,
    gameStatus,
    currentDrawer,
    wordHint,
    myWord,
    wordChoices,
    timeLeft,
    totalTime,
    messages,
    currentRound,
    totalRounds,
    sendGuess,
    chooseWord
  } = useGameSocket(socket, roomId);

  useEffect(() => {
    if (!playerName || !socket.connected) {
      // Re-route to home if no player name (e.g. direct link or refresh)
      navigate('/');
      return;
    }

    return () => {
      socket.emit('room:leave');
    };
  }, [playerName, navigate]);

  useEffect(() => {
    if (gameStatus === 'ended') {
      navigate('/gameover', { state: { players, roomId, playerName, avatar } });
    }
  }, [gameStatus, navigate, players, roomId, playerName, avatar]);

  const handleStartGame = () => {
    socket.emit('game:start');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find my player object
  const me = players.find(p => p.id === socket.id);
  const isDrawer = currentDrawer?.id === socket.id;
  const ownerId = players.length > 0 ? players[0].id : null; 
  const isOwner = ownerId === socket.id;

  return (
    <div className="min-h-screen bg-gray-100 p-2 md:p-4 flex flex-col font-sans h-screen">
      
      {/* Top Bar */}
      <div className="bg-white rounded shadow-sm p-3 mb-4 flex flex-col md:flex-row items-center justify-between border border-gray-200 shrink-0 gap-3">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between">
          <div className="text-xl font-bold text-indigo-600">
            Skribbl<span className="text-pink-500">Clone</span>
          </div>
          {gameStatus === 'playing' && (
            <div className="font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded block md:hidden">
              R {currentRound}/{totalRounds}
            </div>
          )}
        </div>

        {gameStatus === 'playing' && (
          <div className="w-full md:w-1/3 min-w-[200px] flex items-center gap-3">
            <div className="font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded hidden md:block whitespace-nowrap">
              Round {currentRound} of {totalRounds}
            </div>
            <Timer timeLeft={timeLeft} totalTime={totalTime || 80} />
          </div>
        )}

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <span className="text-gray-500 font-semibold">Room Code:</span>
          <button 
            onClick={copyRoomCode}
            className="flex items-center gap-1 bg-indigo-50 text-indigo-700 font-mono font-bold px-3 py-1 rounded hover:bg-indigo-100 transition-colors"
          >
            {roomId}
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row gap-4 flex-grow overflow-hidden">
        
        {/* Left Column: Players */}
        <div className="w-full md:w-64 shrink-0 h-48 md:h-full">
          <PlayerList 
            players={players} 
            ownerId={ownerId}
            currentDrawerId={currentDrawer?.id}
            myId={socket.id}
          />
        </div>

        {/* Center: Canvas Area */}
        <div className="flex-grow flex flex-col min-w-0 bg-white rounded shadow border border-gray-200 relative overflow-hidden h-[50vh] md:h-full">
          {gameStatus === 'waiting' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Waiting for players...</h2>
              <p className="text-gray-600 mb-8 max-w-md">
                Share the room code <strong className="font-mono bg-white px-2 py-1 border rounded">{roomId}</strong> with your friends so they can join!
              </p>
              
              {isOwner && players.length >= 2 ? (
                <button 
                  onClick={handleStartGame}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg text-xl transition-transform hover:scale-105"
                >
                  Start Game
                </button>
              ) : isOwner ? (
                <div className="bg-orange-100 text-orange-800 p-3 rounded font-semibold border border-orange-200">
                  Need at least 2 players to start
                </div>
              ) : (
                <div className="animate-pulse font-semibold text-indigo-600 text-lg">
                  Waiting for room owner to start...
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Word Choice Overlay */}
              {isDrawer && wordChoices.length > 0 && (
                <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-4">
                  <h2 className="text-3xl font-bold text-gray-800 mb-8">Choose a word to draw!</h2>
                  <div className="flex gap-4 flex-wrap justify-center">
                    {wordChoices.map(word => (
                      <button
                        key={word}
                        onClick={() => chooseWord(word)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg shadow-md text-xl transition-transform hover:scale-105"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                  <div className="mt-8 text-xl font-bold text-gray-600">
                    <span className="text-red-500">{timeLeft}</span> seconds left to choose
                  </div>
                </div>
              )}

              <Canvas 
                isDrawer={isDrawer}
                socket={socket}
                roomId={roomId}
                wordHint={wordHint}
                myWord={myWord}
              />
            </>
          )}
        </div>

        {/* Right Column: Chat */}
        <div className="w-full md:w-80 shrink-0 h-64 md:h-full">
          <ChatBox 
            messages={messages}
            onSendMessage={sendGuess}
            isDrawer={isDrawer}
            hasGuessed={me?.hasGuessed}
          />
        </div>

      </div>
    </div>
  );
}
