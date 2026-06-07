/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Shows live scores for all players in the game.
 * 
 * Functions inside:
 * - Leaderboard(props): Renders a sorted list of players with ranks and score details.
 * 
 * Dependencies:
 * - react (useMemo)
 * - lucide-react (Crown, Pencil, CheckCircle)
 * 
 * Dependents:
 * - client/src/pages/Room.jsx
 * - client/src/pages/GameOver.jsx (maybe, but they have their own or reuse this)
 * 
 * Current state: complete
 */

import { useMemo } from 'react';
import { Pencil, CheckCircle, Crown } from 'lucide-react';

export default function Leaderboard({ players, currentDrawerId, ownerId, myId }) {
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score);
  }, [players]);

  return (
    <div className="flex flex-col h-full bg-white rounded shadow border border-gray-200 overflow-hidden">
      <div className="bg-indigo-600 text-white p-3 font-bold text-center">
        Leaderboard
      </div>
      
      <div className="flex-grow overflow-y-auto divide-y divide-gray-100">
        {sortedPlayers.map((player, index) => {
          const isMe = player.id === myId;
          const isDrawer = player.id === currentDrawerId;
          const isOwner = player.id === ownerId;

          return (
            <div 
              key={player.id} 
              className={`flex items-center p-3 transition-colors ${
                isMe ? 'bg-indigo-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="text-gray-400 font-bold w-6 text-center mr-2">
                #{index + 1}
              </div>
              
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm relative mr-3 border-2 border-white"
                style={{ backgroundColor: player.avatar || '#3b82f6' }}
              >
                {player.name.substring(0, 2).toUpperCase()}
                
                {isOwner && (
                  <div className="absolute -top-2 -left-2 text-yellow-500 drop-shadow-md">
                    <Crown size={16} fill="currentColor" />
                  </div>
                )}
              </div>
              
              <div className="flex-grow">
                <div className="font-bold text-gray-800 flex items-center gap-1">
                  {player.name}
                  {isMe && <span className="text-xs text-indigo-500 font-normal">(You)</span>}
                </div>
                <div className="text-sm text-gray-500">
                  {player.score} pts
                </div>
              </div>
              
              <div className="flex items-center justify-center w-8 text-gray-600">
                {isDrawer && <Pencil size={18} className="text-indigo-600" />}
                {player.hasGuessed && <CheckCircle size={18} className="text-green-500" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
