/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Final screen shown after all rounds complete.
 * 
 * Functions inside:
 * - GameOver(): Renders podium, final leaderboard, and play again buttons.
 * 
 * Dependencies:
 * - react
 * - react-router-dom (useLocation, useNavigate)
 * - client/src/socket.js
 * 
 * Dependents:
 * - client/src/App.jsx
 * 
 * Current state: complete
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Medal, Crown, Home } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';

export default function GameOver() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const players = location.state?.players || [];
  const roomId = location.state?.roomId;
  const playerName = location.state?.playerName;
  const avatar = location.state?.avatar;

  // The players array is already sorted descending by gameEngine before emitting game:over
  const top3 = players.slice(0, 3);
  const winner = top3[0];

  const handleGoHome = () => {
    navigate('/');
  };

  if (!winner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50">
        <button onClick={handleGoHome} className="bg-indigo-600 text-white px-4 py-2 rounded">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-50 p-4 flex flex-col items-center overflow-auto">
      <div className="text-center mt-8 mb-12">
        <h1 className="text-5xl font-extrabold text-indigo-600 drop-shadow-sm mb-4">
          Game Over!
        </h1>
        <div className="text-2xl font-bold text-gray-700 flex items-center justify-center gap-2">
          <Trophy className="text-yellow-500" size={32} />
          <span>{winner.name} wins with {winner.score} points!</span>
          <Trophy className="text-yellow-500" size={32} />
        </div>
      </div>

      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-center md:items-start">
        
        {/* Podium */}
        <div className="flex-1 flex items-end justify-center h-64 gap-2 border-b-4 border-indigo-200 pb-2 max-w-lg w-full">
          
          {/* 2nd Place */}
          {top3[1] && (
            <div className="flex flex-col items-center w-24">
              <div className="font-bold text-gray-800 truncate w-full text-center">{top3[1].name}</div>
              <div className="text-gray-500 font-bold mb-2">{top3[1].score} pts</div>
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold border-2 border-white mb-2 shadow-md relative"
                style={{ backgroundColor: top3[1].avatar || '#3b82f6' }}
              >
                {top3[1].name.substring(0,2).toUpperCase()}
                <Medal size={20} className="absolute -bottom-2 text-gray-400 drop-shadow" />
              </div>
              <div className="w-full bg-gray-300 rounded-t h-24 flex items-center justify-center font-black text-white text-3xl shadow-inner">
                2
              </div>
            </div>
          )}

          {/* 1st Place */}
          <div className="flex flex-col items-center w-28">
            <div className="font-bold text-indigo-900 truncate w-full text-center text-lg">{winner.name}</div>
            <div className="text-indigo-600 font-black mb-2">{winner.score} pts</div>
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 border-yellow-400 mb-2 shadow-lg relative"
              style={{ backgroundColor: winner.avatar || '#3b82f6' }}
            >
              {winner.name.substring(0,2).toUpperCase()}
              <Crown size={28} className="absolute -top-4 text-yellow-500 drop-shadow-md" fill="currentColor" />
            </div>
            <div className="w-full bg-yellow-400 rounded-t h-32 flex items-center justify-center font-black text-yellow-100 text-5xl shadow-inner">
              1
            </div>
          </div>

          {/* 3rd Place */}
          {top3[2] && (
            <div className="flex flex-col items-center w-24">
              <div className="font-bold text-gray-800 truncate w-full text-center">{top3[2].name}</div>
              <div className="text-gray-500 font-bold mb-2">{top3[2].score} pts</div>
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold border-2 border-white mb-2 shadow-md relative"
                style={{ backgroundColor: top3[2].avatar || '#3b82f6' }}
              >
                {top3[2].name.substring(0,2).toUpperCase()}
                <Medal size={20} className="absolute -bottom-2 text-amber-700 drop-shadow" />
              </div>
              <div className="w-full bg-orange-300 rounded-t h-20 flex items-center justify-center font-black text-white text-3xl shadow-inner">
                3
              </div>
            </div>
          )}

        </div>

        {/* Full Leaderboard */}
        <div className="w-full md:w-80 flex-shrink-0 h-[400px]">
          <Leaderboard 
            players={players} 
            ownerId={null} 
            currentDrawerId={null} 
            myId={null} 
          />
        </div>

      </div>

      <div className="mt-12 flex gap-4">
        <button 
          onClick={handleGoHome}
          className="flex items-center gap-2 bg-white text-indigo-600 font-bold py-3 px-6 rounded shadow border border-indigo-100 hover:bg-gray-50 transition-colors"
        >
          <Home size={20} /> Home
        </button>
      </div>

    </div>
  );
}
