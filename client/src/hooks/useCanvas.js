/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Custom React hook that handles all canvas drawing logic including mouse events, touch support, and tool switching.
 * 
 * Functions inside:
 * - useCanvas(canvasRef, isDrawer, socket, roomId): Main hook returning tool state and drawing controls.
 * - drawLine(ctx, x0, y0, x1, y1, color, size, tool): Core function that renders a line on the canvas.
 * 
 * Dependencies:
 * - react (useState, useEffect, useRef)
 * 
 * Dependents:
 * - client/src/components/Canvas.jsx
 * 
 * Current state: complete
 */

import { useState, useEffect, useRef } from 'react';

export function useCanvas(canvasRef, isDrawer, socket, roomId) {
  const [tool, setTool] = useState('brush'); // 'brush' or 'eraser'
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const drawLine = (ctx, x0, y0, x1, y1, strokeColor, size, currentTool) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.stroke();
    ctx.closePath();
  };

  const handleStart = (e) => {
    if (!isDrawer) return;
    setIsDrawing(true);
    const pos = getCanvasPos(e);
    lastPos.current = pos;
  };

  const handleMove = (e) => {
    if (!isDrawer || !isDrawing) return;
    e.preventDefault(); // prevent scrolling on touch
    
    const pos = getCanvasPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    drawLine(ctx, lastPos.current.x, lastPos.current.y, pos.x, pos.y, color, brushSize, tool);

    // emit to server
    if (socket && roomId) {
      socket.emit('canvas:draw', {
        x0: lastPos.current.x,
        y0: lastPos.current.y,
        x1: pos.x,
        y1: pos.y,
        color,
        size: brushSize,
        tool
      });
    }

    lastPos.current = pos;
  };

  const handleEnd = () => {
    if (!isDrawer) return;
    setIsDrawing(false);
  };

  const clearCanvas = (emit = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (emit && isDrawer && socket && roomId) {
      socket.emit('canvas:clear');
    }
  };

  // Attach event listeners manually for passive: false on touchmove
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawer) return;

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDrawer, isDrawing, color, brushSize, tool]); // need these dependencies for latest state in handlers

  // Listen to remote drawings
  useEffect(() => {
    if (!socket) return;

    const onDraw = (data) => {
      if (isDrawer) return; // shouldn't happen, but just in case
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      drawLine(ctx, data.x0, data.y0, data.x1, data.y1, data.color, data.size, data.tool);
    };

    const onClear = () => {
      clearCanvas(false);
    };

    const onHistory = (strokes) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      strokes.forEach(stroke => {
        drawLine(ctx, stroke.x0, stroke.y0, stroke.x1, stroke.y1, stroke.color, stroke.size, stroke.tool);
      });
    };

    socket.on('canvas:draw', onDraw);
    socket.on('canvas:clear', onClear);
    socket.on('canvas:history', onHistory); // received when joining

    return () => {
      socket.off('canvas:draw', onDraw);
      socket.off('canvas:clear', onClear);
      socket.off('canvas:history', onHistory);
    };
  }, [socket, isDrawer]);

  return {
    tool,
    setTool,
    color,
    setColor,
    brushSize,
    setBrushSize,
    clearCanvas
  };
}
