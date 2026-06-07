/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Visual countdown timer bar shown during drawing phase.
 * 
 * Functions inside:
 * - Timer(props): Renders a shrinking progress bar that changes color based on time left.
 * 
 * Dependencies:
 * - react (useMemo)
 * 
 * Dependents:
 * - client/src/pages/Room.jsx
 * 
 * Current state: complete
 */

import { useMemo } from 'react';

export default function Timer({ timeLeft, totalTime }) {
  const percentage = useMemo(() => {
    if (!totalTime || totalTime <= 0) return 0;
    return Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));
  }, [timeLeft, totalTime]);

  const colorClass = useMemo(() => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-400';
    return 'bg-red-500';
  }, [percentage]);

  return (
    <div className="w-full bg-gray-200 h-6 rounded-full overflow-hidden relative shadow-inner border border-gray-300">
      <div 
        className={`h-full ${colorClass} transition-all duration-1000 ease-linear`}
        style={{ width: `${percentage}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800 drop-shadow-sm">
        {Math.max(0, timeLeft)}s
      </div>
    </div>
  );
}
