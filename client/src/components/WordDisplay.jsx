/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Shows the word hint (dashes) to guessers.
 * 
 * Functions inside:
 * - WordDisplay(props): Renders the dashed word representation.
 * 
 * Dependencies:
 * - react
 * 
 * Dependents:
 * - client/src/components/Canvas.jsx
 * 
 * Current state: complete
 */

export default function WordDisplay({ hint }) {
  if (!hint) {
    return (
      <div className="text-xl font-bold tracking-widest text-gray-500 italic">
        Waiting for word...
      </div>
    );
  }

  // The hint is formatted by server, e.g. "_ _ _   _ _ _ _ _"
  // 3 spaces separate actual words because each char is separated by 1 space.
  return (
    <div className="text-2xl font-bold tracking-[0.2em] text-gray-800 flex flex-wrap justify-center">
      {hint.split('   ').map((wordPart, i) => (
        <span key={i} className="mx-3 whitespace-pre">
          {wordPart}
        </span>
      ))}
    </div>
  );
}
