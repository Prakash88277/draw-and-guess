/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * The drawing canvas component. Renders a `<canvas>` element and connects it to the `useCanvas` hook.
 * Shows tool controls only if the current player is the drawer.
 * 
 * Functions inside:
 * - Canvas(props): Functional component to render the canvas, toolbar, and word display.
 * 
 * Dependencies:
 * - react (useRef)
 * - client/src/hooks/useCanvas.js
 * - client/src/components/ToolBar.jsx
 * - client/src/components/WordDisplay.jsx
 * 
 * Dependents:
 * - client/src/pages/Room.jsx
 * 
 * Current state: complete
 */

import { useRef, useEffect } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import ToolBar from './ToolBar';
import WordDisplay from './WordDisplay';

export default function Canvas({ isDrawer, socket, roomId, wordHint, myWord, drawerName }) {
  console.log('Canvas rendered, isDrawer:', isDrawer);
  const canvasRef = useRef(null);
  
  const {
    tool, setTool,
    color, setColor,
    brushSize, setBrushSize,
    clearCanvas
  } = useCanvas(canvasRef, isDrawer, socket, roomId);

  useEffect(() => {
    // Set actual canvas size to avoid stretch
    const resizeCanvas = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        canvasRef.current.width = parent.clientWidth;
        canvasRef.current.height = parent.clientHeight;
      }
    };
    
    // Initial resize
    resizeCanvas();
    
    // On window resize, you might want to recalculate, but it clears the canvas.
    // For a robust app, we'd redraw history. For MVP, we skip complex resizing logic.
    // window.addEventListener('resize', resizeCanvas);
    // return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <div className="flex flex-col items-center w-full h-full bg-white rounded shadow relative overflow-hidden border border-gray-200">
      
      <div className="w-full bg-blue-50 p-2 flex flex-col justify-center items-center min-h-[4rem] border-b border-gray-200 z-10">
        {isDrawer ? (
          <div className="text-xl font-bold text-gray-800">
            Your word: <span className="text-indigo-600 tracking-widest">{myWord}</span>
          </div>
        ) : (
          <>
            <WordDisplay hint={wordHint} />
            {drawerName && (
              <div className="text-sm text-gray-500 italic mt-1 font-medium">
                {drawerName} is drawing...
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex-grow w-full relative">
        <canvas
          ref={canvasRef}
          className="bg-white w-full h-full block"
          style={{ touchAction: 'none', cursor: isDrawer ? 'crosshair' : 'default' }}
        />
        
        {!isDrawer && (
          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 text-sm rounded-full shadow pointer-events-none">
            Watch and guess!
          </div>
        )}
      </div>

      {isDrawer && (
        <ToolBar 
          tool={tool} setTool={setTool}
          color={color} setColor={setColor}
          brushSize={brushSize} setBrushSize={setBrushSize}
          onClear={() => clearCanvas(true)}
        />
      )}
    </div>
  );
}
