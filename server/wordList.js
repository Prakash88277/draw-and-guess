/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * Stores the game's word bank and provides utilities to pick random words, add custom words, and format words for display.
 * 
 * Functions inside:
 * - getRandomWords(count): Returns an array of `count` unique random words from the word bank.
 * - addCustomWords(wordArray): Validates and adds an array of custom words to the game.
 * - getWordForDisplay(word): Converts a word into a masked version (e.g., "_ _ _") for guessers.
 * 
 * Dependencies: None
 * 
 * Dependents:
 * - server/gameEngine.js (uses getRandomWords, getWordForDisplay)
 * - server/roomManager.js (may use custom words settings)
 * 
 * Current state: complete
 */

const WORDS = [
  // EASY
  // Animals
  'dog', 'cat', 'elephant', 'tiger', 'lion', 'giraffe', 'zebra', 'bear', 'wolf', 'fox',
  'rabbit', 'deer', 'monkey', 'gorilla', 'kangaroo', 'koala', 'panda', 'sloth', 'rhino', 'hippo',
  // Food
  'apple', 'banana', 'orange', 'grape', 'strawberry', 'watermelon', 'pineapple', 'mango', 'peach', 'cherry',
  'pizza', 'burger', 'sandwich', 'hotdog', 'taco', 'burrito', 'sushi', 'pasta', 'noodle', 'rice',
  // Sports
  'soccer', 'basketball', 'baseball', 'tennis', 'golf', 'volleyball', 'rugby', 'cricket', 'hockey', 'boxing',
  'wrestling', 'swimming', 'cycling', 'running', 'skating', 'skiing', 'snowboarding', 'surfing', 'gymnastics', 'archery',
  // Objects
  'chair', 'table', 'desk', 'bed', 'sofa', 'lamp', 'clock', 'mirror', 'window', 'door',
  'book', 'pen', 'pencil', 'notebook', 'backpack', 'scissors', 'ruler', 'eraser', 'stapler', 'calculator',
  // Nature
  'tree', 'flower', 'grass', 'leaf', 'bush', 'rock', 'stone', 'mountain', 'hill', 'valley',
  'river', 'lake', 'ocean', 'sea', 'waterfall', 'cloud', 'rain', 'snow', 'wind', 'storm',
  // Technology
  'computer', 'laptop', 'tablet', 'phone', 'smartphone', 'keyboard', 'mouse', 'monitor', 'printer', 'speaker',
  'headphones', 'microphone', 'camera', 'television', 'radio', 'watch', 'clock', 'battery', 'charger', 'cable',

  // MEDIUM
  'volcano', 'telescope', 'umbrella', 'thunderstorm', 'submarine', 'escalator', 'backpack', 'parachute', 'skateboard', 'waterfall', 
  'compass', 'lighthouse', 'hammock', 'avalanche', 'binoculars', 'catapult', 'windmill', 'jellyfish', 'stalactite', 'periscope', 
  'boomerang', 'chandelier', 'quicksand', 'tornado', 'snowflake', 'constellation', 'hourglass', 'trampoline', 'conveyor belt', 
  'fire hydrant', 'traffic light', 'hot air balloon', 'solar panel', 'diving board', 'speed bump', 'revolving door', 'shopping cart', 
  'parking meter', 'fire escape', 'manhole cover',

  // HARD
  'democracy', 'gravity', 'echo', 'silence', 'dream', 'memory', 'hunger', 'jealousy', 'evolution', 'inflation', 
  'deadline', 'nightmare', 'freedom', 'patience', 'nostalgia', 'rhythm', 'temperature', 'electricity', 'pollution', 'tradition', 
  'ambition', 'coincidence', 'paranoia', 'procrastination', 'enthusiasm', 'sarcasm', 'equilibrium', 'momentum', 'renaissance', 'phenomenon'
];

let CUSTOM_WORDS = [];

/**
 * Takes the WORDS array, shuffles it using Fisher-Yates algorithm
 * Returns `count` unique random words as an array
 * @param {number} count 
 * @returns {string[]}
 */
function getRandomWords(count = 3) {
  const pool = [...WORDS, ...CUSTOM_WORDS];
  
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}

/**
 * Validates each word: must be string, 2–30 chars, no special characters
 * Adds valid words to a CUSTOM_WORDS array
 * Returns { added: number, rejected: number }
 * @param {string[]} wordArray 
 * @returns {object}
 */
function addCustomWords(wordArray) {
  let added = 0;
  let rejected = 0;

  if (!Array.isArray(wordArray)) {
    return { added, rejected };
  }

  for (const word of wordArray) {
    if (
      typeof word === 'string' &&
      word.length >= 2 &&
      word.length <= 30 &&
      /^[a-zA-Z0-9\s]+$/.test(word)
    ) {
      CUSTOM_WORDS.push(word.toLowerCase());
      added++;
    } else {
      rejected++;
    }
  }

  return { added, rejected };
}

/**
 * Replaces every letter with underscore '_', keeps spaces as ' '
 * Example: 'ice cream' → '_ _ _   _ _ _ _ _'
 * @param {string} word 
 * @returns {string}
 */
function getWordForDisplay(word) {
  if (!word) return '';
  return word
    .split('')
    .map(char => (char === ' ' ? ' ' : '_'))
    .join(' ');
}

module.exports = {
  getRandomWords,
  addCustomWords,
  getWordForDisplay,
  WORDS,
  CUSTOM_WORDS
};
