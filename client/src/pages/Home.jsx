/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Landing page where players enter their name, pick an avatar color, and either create a new room or join an existing one.
 * 
 * Functions inside:
 * - Home(): Component handling name, avatar, and room creation/joining forms.
 * 
 * Dependencies:
 * - react (useState, useEffect)
 * - react-router-dom (useNavigate)
 * - client/src/socket.js
 * 
 * Dependents:
 * - client/src/App.jsx
 * 
 * Current state: complete
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'];

export default function Home() {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(COLORS[4]); // default blue
  const [roomCode, setRoomCode] = useState('');
  
  // Settings for create room
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(80);
  const [maxPlayers, setMaxPlayers] = useState(8);

  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const onRoomCreated = ({ roomId }) => {
      navigate(`/room/${roomId}`, { state: { playerName: name, avatar } });
    };

    const onRoomJoined = (room) => {
      navigate(`/room/${room.id}`, { state: { playerName: name, avatar } });
    };

    const onError = (msg) => {
      setError(msg);
    };

    socket.on('room:created', onRoomCreated);
    socket.on('room:joined', onRoomJoined);
    socket.on('error', onError);

    return () => {
      socket.off('room:created', onRoomCreated);
      socket.off('room:joined', onRoomJoined);
      socket.off('error', onError);
    };
  }, [name, avatar, navigate]);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }
    setError('');
    socket.emit('room:create', {
      playerName: name.trim(),
      avatar,
      settings: { rounds, drawTime, maxPlayers }
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    setError('');
    socket.emit('room:join', {
      roomId: roomCode.trim(),
      playerName: name.trim(),
      avatar
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-indigo-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-4xl w-full border border-indigo-100">
        
        <h1 className="text-5xl font-extrabold text-center text-indigo-600 mb-8 tracking-tight">
          Skribbl<span className="text-pink-500">Clone</span>
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-6 text-center font-semibold">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Profile Setup */}
          <div className="flex-1 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Setup Profile</h2>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">Your Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                placeholder="Enter name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={15}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">Avatar Color</label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map(c => (
                  <button
                    key={c}
                    className={`w-10 h-10 rounded-full border-4 transition-all ${
                      avatar === c ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setAvatar(c)}
                  />
                ))}
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-inner border-4 border-white"
                style={{ backgroundColor: avatar }}
              >
                {name.substring(0, 2).toUpperCase() || '?'}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            
            {/* Create Room */}
            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100 flex-1">
              <h2 className="text-2xl font-bold text-indigo-800 mb-4">Create Private Room</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-indigo-700 font-semibold mb-1 text-sm">Rounds</label>
                  <select 
                    className="w-full p-2 rounded border-indigo-200"
                    value={rounds} onChange={(e) => setRounds(Number(e.target.value))}
                  >
                    {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-indigo-700 font-semibold mb-1 text-sm">Draw Time (s)</label>
                  <select 
                    className="w-full p-2 rounded border-indigo-200"
                    value={drawTime} onChange={(e) => setDrawTime(Number(e.target.value))}
                  >
                    {[30, 45, 60, 80, 100, 120].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <button 
                onClick={handleCreateRoom}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded shadow-md transition-colors text-lg"
              >
                Create Room
              </button>
            </div>

            {/* Join Room */}
            <div className="bg-pink-50 p-6 rounded-lg border border-pink-100 flex-1">
              <h2 className="text-2xl font-bold text-pink-800 mb-4">Join Room</h2>
              
              <div className="mb-4">
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-pink-200 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono text-center text-lg"
                  placeholder="ENTER ROOM CODE"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                />
              </div>

              <button 
                onClick={handleJoinRoom}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded shadow-md transition-colors text-lg"
              >
                Join Room
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
