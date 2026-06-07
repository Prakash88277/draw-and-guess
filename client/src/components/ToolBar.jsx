/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Drawing tool controls for the active drawer.
 * 
 * Functions inside:
 * - ToolBar(props): Renders color palette, brush size slider, tool toggles, and clear button.
 * 
 * Dependencies:
 * - lucide-react (icons)
 * 
 * Dependents:
 * - client/src/components/Canvas.jsx
 * 
 * Current state: complete
 */

import { useState } from 'react';
import { Pen, Eraser, Trash2 } from 'lucide-react';

const COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff',
  '#c0c0c0', '#808080', '#800000', '#808000', '#008000', '#800080', '#008080', '#000080'
];

export default function ToolBar({ tool, setTool, color, setColor, brushSize, setBrushSize, onClear }) {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearClick = () => {
    if (confirmClear) {
      onClear();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 2000);
    }
  };

  return (
    <div className="w-full bg-gray-50 border-t border-gray-200 p-2 flex items-center justify-between z-10 flex-wrap gap-2">
      
      {/* Colors */}
      <div className="flex flex-wrap max-w-[200px] gap-1">
        {COLORS.map((c) => (
          <button
            key={c}
            className={`w-5 h-5 rounded-full border transition-transform ${
              color === c && tool === 'brush' ? 'border-gray-800 scale-125 z-10 shadow-sm' : 'border-gray-300'
            }`}
            style={{ backgroundColor: c }}
            onClick={() => {
              setColor(c);
              setTool('brush');
            }}
          />
        ))}
      </div>

      {/* Tools */}
      <div className="flex items-center gap-4">
        
        {/* Brush Size */}
        <div className="flex items-center gap-2">
          <div className="w-8 flex justify-center">
            <div 
              className="rounded-full bg-gray-800"
              style={{ width: Math.min(brushSize, 24), height: Math.min(brushSize, 24) }}
            />
          </div>
          <input 
            type="range" 
            min="2" max="40" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24 accent-indigo-600"
          />
        </div>

        {/* Toggles */}
        <div className="flex gap-1 bg-gray-200 p-1 rounded-lg">
          <button
            className={`p-2 rounded ${tool === 'brush' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:bg-gray-300'}`}
            onClick={() => setTool('brush')}
            title="Brush"
          >
            <Pen size={18} />
          </button>
          <button
            className={`p-2 rounded ${tool === 'eraser' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:bg-gray-300'}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            <Eraser size={18} />
          </button>
        </div>

        {/* Clear Button */}
        <button
          className={`p-2 rounded flex items-center gap-1 transition-colors ${
            confirmClear ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600'
          }`}
          onClick={handleClearClick}
          title="Clear Canvas"
        >
          <Trash2 size={18} />
          {confirmClear && <span className="text-sm font-bold px-1">Sure?</span>}
        </button>

      </div>
    </div>
  );
}
