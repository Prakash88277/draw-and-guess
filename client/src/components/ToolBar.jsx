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
import { Pen, Eraser, Trash2, Palette } from 'lucide-react';

const COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff',
  '#c0c0c0', '#808080', '#800000', '#808000', '#008000', '#800080', '#008080', '#000080'
];

export default function ToolBar({ tool, setTool, color, setColor, brushSize, setBrushSize, onClear }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  const handleClearClick = () => {
    if (confirmClear) {
      onClear();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 2000);
    }
  };

  const toolbarContent = (
    <div className="flex flex-col md:flex-row w-full bg-white md:bg-gray-50 border-t border-gray-200 p-4 md:p-2 items-center justify-between gap-4 md:gap-2">
      
      {/* Colors */}
      <div className="grid grid-cols-8 md:flex md:flex-wrap md:max-w-[200px] gap-2 md:gap-1 w-full md:w-auto justify-items-center">
        {COLORS.map((c) => (
          <button
            key={c}
            className={`w-9 h-9 md:w-5 md:h-5 rounded-full border transition-transform ${
              color === c && tool === 'brush' ? 'border-gray-800 scale-125 z-10 shadow-md md:shadow-sm' : 'border-gray-300'
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
      <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
        
        {/* Brush Size */}
        <div className="flex items-center gap-3 md:gap-2 w-full md:w-auto">
          <div className="w-8 flex justify-center shrink-0">
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
            className="w-full md:w-24 accent-indigo-600"
          />
        </div>

        {/* Toggles */}
        <div className="flex w-full md:w-auto justify-center gap-2 bg-gray-200 p-1 rounded-lg">
          <button
            className={`flex-1 md:flex-none p-3 md:p-2 rounded flex justify-center items-center h-10 px-4 md:px-2 md:h-auto ${tool === 'brush' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:bg-gray-300'}`}
            onClick={() => setTool('brush')}
            title="Brush"
          >
            <Pen size={20} className="md:w-[18px] md:h-[18px]" />
          </button>
          <button
            className={`flex-1 md:flex-none p-3 md:p-2 rounded flex justify-center items-center h-10 px-4 md:px-2 md:h-auto ${tool === 'eraser' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:bg-gray-300'}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            <Eraser size={20} className="md:w-[18px] md:h-[18px]" />
          </button>
        </div>

        {/* Clear Button */}
        <button
          className={`w-full md:w-auto p-3 md:p-2 rounded flex items-center justify-center gap-2 h-10 px-4 md:px-2 md:h-auto font-bold md:font-normal transition-colors ${
            confirmClear ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600'
          }`}
          onClick={handleClearClick}
          title="Clear Canvas"
        >
          <Trash2 size={20} className="md:w-[18px] md:h-[18px]" />
          {confirmClear && <span className="text-sm px-1">Sure?</span>}
          <span className="md:hidden">Clear</span>
        </button>

      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Toolbar */}
      <div className="hidden md:block w-full z-10">
        {toolbarContent}
      </div>

      {/* Mobile Floating Button */}
      <button 
        onClick={() => setShowToolbar(true)}
        className="absolute bottom-4 right-4 z-30 bg-indigo-600 text-white p-3 rounded-full shadow-lg md:hidden"
      >
        <Palette size={24} />
      </button>

      {/* Mobile Bottom Sheet */}
      {showToolbar && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl w-full flex flex-col shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg text-gray-800">Drawing Tools</h3>
              <button 
                onClick={() => setShowToolbar(false)}
                className="font-bold text-indigo-600 px-4 py-1 bg-indigo-50 rounded-full"
              >
                Done ✓
              </button>
            </div>
            {toolbarContent}
          </div>
        </div>
      )}
    </>
  );
}
