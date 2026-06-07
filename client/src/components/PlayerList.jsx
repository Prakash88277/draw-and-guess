/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Shows all players in the room with their avatar and status (owner, drawer, etc.).
 * 
 * Functions inside:
 * - PlayerList(props): Renders a list of players.
 * 
 * Dependencies:
 * - react
 * - lucide-react (Crown, Pencil)
 * 
 * Dependents:
 * - client/src/pages/Room.jsx
 * 
 * Current state: complete
 */

import { Crown, Pencil } from 'lucide-react';

export default function PlayerList({ players, ownerId, currentDrawerId, myId }) {
  return (
    <div className="flex flex-col h-full bg-white rounded shadow border border-gray-200 overflow-hidden">
      <div className="bg-indigo-600 text-white p-3 font-bold flex justify-between items-center">
        <span>Players</span>
        <span className="text-sm bg-indigo-700 px-2 py-0.5 rounded-full">{players.length}</span>
      </div>
      
      <div className="flex-grow overflow-y-auto divide-y divide-gray-100">
        {players.map((player) => {
          const isMe = player.id === myId;
          const isOwner = player.id === ownerId;
          const isDrawer = player.id === currentDrawerId;

          return (
            <div 
              key={player.id} 
              className={`flex items-center p-3 transition-colors ${
                isMe ? 'bg-indigo-50' : 'hover:bg-gray-50'
              }`}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm relative mr-3 border-2 border-white"
                style={{ backgroundColor: player.avatar || '#3b82f6' }}
              >
                {player.name.substring(0, 2).toUpperCase()}
                
                {isOwner && (
                  <div className="absolute -top-2 -left-2 text-yellow-500 drop-shadow-md bg-white rounded-full p-0.5">
                    <Crown size={14} fill="currentColor" />
                  </div>
                )}
              </div>
              
              <div className="flex-grow flex flex-col justify-center">
                <div className="font-bold text-gray-800 flex items-center gap-1">
                  {player.name}
                  {isMe && <span className="text-xs text-indigo-500 font-normal">(You)</span>}
                </div>
                <div className="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-max mt-1">
                  Score: {player.score}
                </div>
              </div>
              
              <div className="flex items-center justify-center w-8 text-gray-600">
                {isDrawer && <Pencil size={18} className="text-indigo-600" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
