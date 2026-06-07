/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Chat and guess input for all players.
 * 
 * Functions inside:
 * - ChatBox(props): Renders the message list and input field.
 * 
 * Dependencies:
 * - react (useState, useEffect, useRef)
 * 
 * Dependents:
 * - client/src/pages/Room.jsx
 * 
 * Current state: complete
 */

import { useState, useEffect, useRef } from 'react';

export default function ChatBox({ messages, onSendMessage, isDrawer, hasGuessed }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isDrawer && !hasGuessed) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded shadow border border-gray-200 overflow-hidden">
      <div className="bg-gray-100 p-3 border-b border-gray-200 font-bold text-gray-700">
        Chat & Guesses
      </div>
      
      <div className="flex-grow overflow-y-auto p-3 space-y-2 text-sm flex flex-col">
        {messages.map((m, i) => (
          <div 
            key={i} 
            className={`px-2 py-1.5 rounded ${
              m.type === 'system' ? 'text-gray-500 italic bg-gray-50 text-center text-xs' :
              m.type === 'correct' ? 'bg-green-100 text-green-800 font-bold' :
              'bg-blue-50 text-gray-800'
            }`}
          >
            {m.type === 'chat' && <span className="font-bold mr-2">{m.playerName}:</span>}
            {m.type === 'correct' && <span className="mr-1">✓ {m.playerName}</span>}
            <span>{m.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
            placeholder={
              isDrawer ? "(You are drawing — no guessing!)" :
              hasGuessed ? "(You guessed correctly! 🎉)" :
              "Type your guess here..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isDrawer || hasGuessed}
            maxLength={100}
            autoComplete="off"
          />
        </form>
      </div>
    </div>
  );
}
