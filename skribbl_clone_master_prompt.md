# Master Prompt — Skribbl.io Clone (Full-Stack Real-Time Drawing & Guessing Game)

---

## INTRODUCTION

You are an expert full-stack developer. I want you to help me build a **Skribbl.io clone** — a real-time multiplayer drawing and guessing game that works in the browser. The game allows players to join a private room via an invite link, take turns drawing a word on a shared canvas, and earn points by guessing other players' drawings correctly.

This is a complete project built from scratch. I will give you one file at a time to implement. For every file you create, you MUST also write a **FILE DOCUMENTATION BLOCK** at the top of the file (as a comment) that contains:
- What this file does
- All functions/classes inside it with a one-line description each
- What other files it depends on
- What other files depend on it
- Current state (complete / partial / in progress)

This documentation block ensures that even if you lose context mid-project, reading any single file will give you full understanding of its role, dependencies, and how it fits into the whole system.

---

## OBJECTIVE

Build a browser-based real-time multiplayer game with the following core features:

1. Player creates or joins a private room via a unique invite link
2. Players can set a username and avatar before joining
3. The game has rounds where one player draws and others guess
4. The drawer picks a word from 3 random options
5. Other players type guesses in a chat box; correct guesses give points
6. Points are calculated based on how fast the correct guess is made
7. A live leaderboard updates after every turn
8. A countdown timer runs during each drawing turn
9. The canvas supports brush, eraser, color picker, brush size, and clear
10. At the end of all rounds, a final winner screen is shown
11. Room owner can start the game and configure settings (rounds, draw time, custom words)

---

## TECH STACK

### Frontend
- **React** (with Vite as build tool)
- **HTML5 Canvas API** — for drawing functionality
- **Socket.io-client** — for real-time communication with server
- **TailwindCSS** — for styling
- **React Router** — for page navigation (Home, Room, Game Over)

### Backend
- **Node.js** with **Express** — HTTP server
- **Socket.io** — WebSocket server for real-time events
- **uuid** package — to generate unique room IDs
- **cors** package — to allow frontend-backend communication

### Storage
- **In-memory JavaScript objects** (no database needed for MVP)
- A `rooms` Map object on the server stores all active room state
- Optional: **Redis** for scaling (not needed in MVP)

### Deployment
- Frontend: **Vercel** or **Netlify**
- Backend: **Render** or **Railway** (must support persistent WebSocket connections — do NOT use serverless)

---

## PROJECT FOLDER STRUCTURE

Build exactly the following files in this order. Do not skip any file. Do not combine files.

```
skribbl-clone/
│
├── server/
│   ├── index.js                  ← Express + Socket.io server entry point
│   ├── roomManager.js            ← All room state logic (create, join, leave)
│   ├── gameEngine.js             ← Game loop, turn rotation, timer, scoring
│   ├── wordList.js               ← Word bank and word picker function
│   └── socketHandlers.js         ← All socket event listeners and emitters
│
├── client/
│   ├── index.html                ← Vite HTML entry point
│   ├── src/
│   │   ├── main.jsx              ← React root render
│   │   ├── App.jsx               ← Router setup (Home, Room, GameOver routes)
│   │   ├── socket.js             ← Socket.io-client singleton instance
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx          ← Landing page (create room / join room)
│   │   │   ├── Room.jsx          ← Main game page (canvas + chat + leaderboard)
│   │   │   └── GameOver.jsx      ← Final scores + winner announcement
│   │   │
│   │   ├── components/
│   │   │   ├── Canvas.jsx        ← Drawing canvas with tools
│   │   │   ├── ChatBox.jsx       ← Chat + guess input
│   │   │   ├── Leaderboard.jsx   ← Live score display
│   │   │   ├── Timer.jsx         ← Countdown timer bar
│   │   │   ├── WordDisplay.jsx   ← Shows word hint (dashes) to guessers
│   │   │   ├── ToolBar.jsx       ← Brush, eraser, colors, size, clear button
│   │   │   └── PlayerList.jsx    ← Shows all players with avatar + status
│   │   │
│   │   └── hooks/
│   │       ├── useCanvas.js      ← Canvas drawing logic (mouse events)
│   │       └── useGameSocket.js  ← All socket listeners for game state
│
├── package.json                  ← Root scripts (start server, start client)
└── .env                          ← PORT and CLIENT_URL environment variables
```

---

## FILE-BY-FILE IMPLEMENTATION GUIDE

Implement each file one at a time. Before writing any code, re-read the documentation block at the top of any file I give you for context.

---

### FILE 1 — `server/wordList.js`

**Purpose:** Stores the word bank and provides a function to pick random words.

**Functions to implement:**

```
getRandomWords(count)
  - Input: count (number, default 3)
  - Takes the WORDS array, shuffles it using Fisher-Yates algorithm
  - Returns `count` unique random words as an array
  - Example: getRandomWords(3) → ['apple', 'guitar', 'ocean']

addCustomWords(wordArray)
  - Input: wordArray (array of strings)
  - Validates each word: must be string, 2–30 chars, no special characters
  - Adds valid words to a CUSTOM_WORDS array
  - Returns { added: number, rejected: number }

getWordForDisplay(word)
  - Input: word (string)
  - Replaces every letter with underscore '_', keeps spaces as ' '
  - Example: 'ice cream' → '_ _ _   _ _ _ _ _'
  - Used to show guessers how many letters the word has
```

**Important notes:**
- Include at least 100 words in the default WORDS array across categories: animals, food, sports, objects, nature, technology
- Words should be suitable for all ages
- Export: `module.exports = { getRandomWords, addCustomWords, getWordForDisplay, WORDS }`

---

### FILE 2 — `server/roomManager.js`

**Purpose:** Manages all active game rooms. Each room is stored in a `rooms` Map. This is the single source of truth for all room and player state.

**Data structure for a room:**
```js
{
  id: 'abc123',              // unique room ID (uuid)
  ownerId: 'socketId',       // who created the room
  players: [
    {
      id: 'socketId',
      name: 'Prakash',
      avatar: 'purple',
      score: 0,
      hasGuessed: false,
      isDrawing: false
    }
  ],
  settings: {
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,            // seconds
    customWords: [],
    useCustomWordsOnly: false
  },
  gameState: {
    status: 'waiting',       // 'waiting' | 'playing' | 'ended'
    currentRound: 0,
    currentDrawerIndex: 0,
    currentWord: null,
    wordChoices: [],
    timeLeft: 0,
    canvasStrokes: []        // stores all strokes so late-joiners see current canvas
  }
}
```

**Functions to implement:**

```
createRoom(socketId, playerName, avatar, settings)
  - Generates a new room ID using uuid()
  - Creates the room object with above structure
  - Creates the first player (the owner) and adds to players array
  - Stores room in rooms Map
  - Returns the full room object

joinRoom(roomId, socketId, playerName, avatar)
  - Validates: room must exist, status must be 'waiting', players < maxPlayers
  - If valid: creates player object, pushes to room.players
  - Returns { success: true, room } or { success: false, reason: '...' }

leaveRoom(socketId)
  - Searches all rooms for a player with this socketId
  - Removes the player from the room
  - If room becomes empty: deletes the room from the Map
  - If owner left and room not empty: assigns ownership to next player
  - Returns { roomId, room } or null if player wasn't in any room

getRoomBySocketId(socketId)
  - Iterates rooms Map to find which room contains this socketId
  - Returns the room object or null

getRoomById(roomId)
  - Returns rooms.get(roomId) or null

updatePlayerScore(roomId, socketId, points)
  - Finds player in room.players by socketId
  - Adds points to player.score
  - Returns updated player or null

resetGuessFlags(roomId)
  - Sets hasGuessed = false for all players in the room
  - Used at the start of each new turn

saveCanvasStroke(roomId, strokeData)
  - Appends strokeData to room.gameState.canvasStrokes array
  - strokeData = { type: 'draw'|'clear', x, y, color, size, ... }

clearCanvasHistory(roomId)
  - Sets room.gameState.canvasStrokes = []
  - Called when canvas is cleared or new turn starts
```

**Important notes:**
- All functions must validate inputs and handle edge cases silently (no crashes)
- Export: `module.exports = { createRoom, joinRoom, leaveRoom, getRoomBySocketId, getRoomById, updatePlayerScore, resetGuessFlags, saveCanvasStroke, clearCanvasHistory }`

---

### FILE 3 — `server/gameEngine.js`

**Purpose:** Controls the full game loop. Manages turn start/end, timer countdown, word selection phase, scoring calculation, and round progression. Uses `roomManager` for state and emits events via the Socket.io `io` instance passed in.

**Functions to implement:**

```
startGame(io, roomId)
  - Sets room.gameState.status = 'playing'
  - Sets currentRound = 1, currentDrawerIndex = 0
  - Calls startTurn(io, roomId)

startTurn(io, roomId)
  - Resets hasGuessed flags for all players via resetGuessFlags()
  - Clears canvas history via clearCanvasHistory()
  - Gets 3 random words via getRandomWords(3)
  - Sets room.gameState.wordChoices = those 3 words
  - Sets the current drawer's isDrawing = true
  - Emits 'turn:start' to all players in room with drawer info
  - Emits 'word:choices' ONLY to the drawer (3 word options)
  - Emits 'word:hint' to all non-drawers (dashes via getWordForDisplay)
  - Starts a 15-second word selection timer
  - If drawer doesn't pick in 15s: auto-picks first word, calls beginDrawing()

beginDrawing(io, roomId, chosenWord)
  - Sets room.gameState.currentWord = chosenWord
  - Emits 'drawing:start' to room with timeLeft = room.settings.drawTime
  - Starts countdown timer using setInterval every 1 second
  - Each tick: decrements timeLeft, emits 'timer:tick' to room
  - When timeLeft hits 0: calls endTurn(io, roomId)

endTurn(io, roomId)
  - Clears the countdown interval
  - Sets isDrawing = false for current drawer
  - Emits 'turn:end' to room with the correct word revealed
  - Waits 3 seconds (setTimeout), then calls nextTurn(io, roomId)

nextTurn(io, roomId)
  - Increments currentDrawerIndex
  - If currentDrawerIndex >= players.length:
      → increment currentRound
      → reset currentDrawerIndex = 0
  - If currentRound > settings.rounds: calls endGame(io, roomId)
  - Else: calls startTurn(io, roomId)

endGame(io, roomId)
  - Sets room.gameState.status = 'ended'
  - Sorts players by score descending
  - Emits 'game:over' to room with final sorted player scores

calculateScore(timeLeft, maxTime, totalGuessers, guessOrder)
  - Formula: base score = 100
  - Time bonus = Math.floor((timeLeft / maxTime) * 100)  → max +100
  - Early guesser bonus: first correct guess gets +50, second +30, third +10
  - guessOrder = how many players have already guessed correctly before this one
  - Returns total points for this correct guess

handleCorrectGuess(io, roomId, socketId, playerName)
  - Marks player.hasGuessed = true
  - Counts how many have guessed so far (guessOrder)
  - Calls calculateScore() to get points
  - Calls updatePlayerScore() to add points
  - Emits 'guess:correct' to room (without revealing word) with player name
  - Emits 'score:update' to room with full updated player list
  - Checks: if ALL non-drawers have guessed → call endTurn() early
```

**Important notes:**
- Store interval references in a `timers` Map keyed by roomId so you can clear them properly
- Never let two timers run for the same room simultaneously — always clearInterval before starting a new one
- Export: `module.exports = { startGame, startTurn, beginDrawing, endTurn, nextTurn, endGame, calculateScore, handleCorrectGuess }`

---

### FILE 4 — `server/socketHandlers.js`

**Purpose:** Registers all Socket.io event listeners. This is the bridge between client events and server logic. Import roomManager and gameEngine here.

**Events to handle (client → server):**

```
'room:create'  → payload: { playerName, avatar, settings }
  - Calls createRoom()
  - socket.join(roomId)
  - Emits 'room:created' back to this socket with { roomId, room }

'room:join'  → payload: { roomId, playerName, avatar }
  - Calls joinRoom()
  - If success: socket.join(roomId), emit 'room:joined' to socket with room
  - Emits 'room:updated' to entire room with new player list
  - Sends canvas history to the new joiner so they see current drawing

'room:leave'  → no payload
  - Calls leaveRoom(socket.id)
  - Emits 'room:updated' to remaining players

'game:start'  → no payload
  - Validates: socket.id must be room owner
  - Validates: at least 2 players in room
  - Calls startGame(io, roomId)

'canvas:draw'  → payload: { x0, y0, x1, y1, color, size, tool }
  - Saves stroke via saveCanvasStroke()
  - Broadcasts 'canvas:draw' to all OTHER players in room (socket.to(roomId).emit)
  - Do NOT emit back to sender (they already drew it locally)

'canvas:clear'  → no payload
  - Calls clearCanvasHistory()
  - Broadcasts 'canvas:clear' to all other players in room

'word:chosen'  → payload: { word }
  - Validates: socket.id is current drawer
  - Calls beginDrawing(io, roomId, word)

'chat:message'  → payload: { message }
  - If game is playing AND player hasn't guessed AND player is not drawer:
      → Compare message.toLowerCase() with currentWord.toLowerCase()
      → If match: call handleCorrectGuess()
      → If no match: broadcast 'chat:message' to room with { playerName, message }
  - If player is drawer or has already guessed: still broadcast message but don't check

'disconnect'  → automatic
  - Calls leaveRoom(socket.id)
  - Emits 'room:updated' to remaining room players
  - If the disconnected player was drawing: call endTurn() early
```

**Important notes:**
- Register all handlers inside a function `registerSocketHandlers(io)` that is called once from index.js
- Use `io.on('connection', (socket) => { ... })` pattern
- Export: `module.exports = { registerSocketHandlers }`

---

### FILE 5 — `server/index.js`

**Purpose:** Entry point for the backend server. Sets up Express, Socket.io, CORS, and starts listening.

**What to implement:**
- Create Express app and HTTP server
- Attach Socket.io to HTTP server with CORS config allowing the frontend URL
- Call `registerSocketHandlers(io)` to register all socket events
- Serve a health check route: `GET /health` → `{ status: 'ok' }`
- Listen on `process.env.PORT || 3001`
- Log: `Server running on port 3001`

---

### FILE 6 — `client/src/socket.js`

**Purpose:** Creates a single Socket.io-client instance shared across the entire React app. Using a singleton prevents multiple connections being created.

**What to implement:**
- Import `io` from `socket.io-client`
- Create socket with `autoConnect: false` (we connect manually when user joins a room)
- Export the socket instance as default
- The server URL should come from `import.meta.env.VITE_SERVER_URL` (Vite env variable)

---

### FILE 7 — `client/src/hooks/useCanvas.js`

**Purpose:** Custom React hook that handles all canvas drawing logic including mouse events, touch support, and tool switching.

**Functions/logic to implement:**

```
useCanvas(canvasRef, isDrawer, socket, roomId)
  Parameters:
    canvasRef  - React ref pointing to the <canvas> element
    isDrawer   - boolean, whether this player is currently drawing
    socket     - socket.io client instance
    roomId     - current room ID for emitting events

  State:
    tool       - 'brush' | 'eraser'
    color      - current hex color string
    brushSize  - number (1–40)
    isDrawing  - boolean (mouse is held down)
    lastPos    - { x, y } last mouse position

  Mouse event handlers (only active if isDrawer is true):
    handleMouseDown(e)
      - Sets isDrawing = true
      - Records lastPos from e.offsetX, e.offsetY

    handleMouseMove(e)
      - If not isDrawing: return
      - Gets current position from e.offsetX, e.offsetY
      - Calls drawLine(lastPos, currentPos, color, brushSize, tool)
      - Emits 'canvas:draw' via socket with stroke data
      - Updates lastPos

    handleMouseUp()
      - Sets isDrawing = false

  Core drawing function:
    drawLine(ctx, x0, y0, x1, y1, color, size, tool)
      - If tool is 'eraser': set ctx.globalCompositeOperation = 'destination-out'
      - If tool is 'brush': set ctx.globalCompositeOperation = 'source-over'
      - Draw a line from (x0,y0) to (x1,y1) with given color and lineWidth=size
      - Use ctx.beginPath(), ctx.moveTo(), ctx.lineTo(), ctx.stroke()
      - Use lineCap = 'round' for smooth lines

  Socket listener (for non-drawers):
    socket.on('canvas:draw', (data) => drawLine with received data)
    socket.on('canvas:clear', () => ctx.clearRect(0,0,width,height))

  Returns: { tool, setTool, color, setColor, brushSize, setBrushSize, clearCanvas }
```

**Important notes:**
- Normalize coordinates by canvas actual size vs displayed size (devicePixelRatio handling)
- Use `useEffect` to attach/detach mouse listeners based on `isDrawer`
- Add touch event support: `touchstart`, `touchmove`, `touchend` mapping to mouse equivalents

---

### FILE 8 — `client/src/hooks/useGameSocket.js`

**Purpose:** Custom React hook that listens to all game-related socket events and maintains local game state in the Room component.

**State managed:**
```
players       - array of player objects
gameStatus    - 'waiting' | 'playing' | 'ended'
currentDrawer - player object of who is drawing
wordHint      - string of dashes e.g. '_ _ _ _ _'
myWord        - string (only set if I am the drawer)
wordChoices   - array of 3 strings (only for drawer during selection phase)
timeLeft      - number
messages      - array of { playerName, message, type: 'chat'|'correct'|'system' }
currentRound  - number
totalRounds   - number
```

**Socket events to listen for:**
```
'room:updated'     → update players list
'turn:start'       → update currentDrawer, reset wordHint
'word:choices'     → set wordChoices (only drawer receives this)
'word:hint'        → set wordHint (dashes for guessers)
'drawing:start'    → set timeLeft from server, clear wordChoices
'timer:tick'       → update timeLeft
'turn:end'         → reveal word in messages, update players
'guess:correct'    → add system message "[Name] guessed correctly!"
'score:update'     → update players scores
'chat:message'     → add message to messages array
'game:over'        → set gameStatus = 'ended', store final scores
```

**Returns:** all state variables + `sendGuess(message)` function + `chooseWord(word)` function

---

### FILE 9 — `client/src/components/Canvas.jsx`

**Purpose:** The drawing canvas component. Renders a `<canvas>` element and connects it to the `useCanvas` hook. Shows tool controls only if the current player is the drawer.

**What to render:**
- A `<canvas>` element filling its container
- If `isDrawer`: render the `<ToolBar>` component below canvas
- If NOT `isDrawer`: render a semi-transparent overlay with text "Watch and guess!" that doesn't block the canvas view
- Show the word to drawer at top: "Your word: **[word]**"
- Show dashes to guessers at top via `<WordDisplay>` component

---

### FILE 10 — `client/src/components/ToolBar.jsx`

**Purpose:** Drawing tool controls for the active drawer.

**What to render:**
- Color palette: at least 16 color swatches (hardcoded hex array)
- Active color indicator (larger swatch showing current color)
- Brush size slider (range input, min=2, max=40)
- Tool toggle buttons: Brush icon, Eraser icon
- Clear Canvas button (with confirmation: clicking once highlights it red, clicking again clears)
- Current tool should be visually highlighted

---

### FILE 11 — `client/src/components/ChatBox.jsx`

**Purpose:** Chat and guess input for all players.

**What to render:**
- Scrollable message list (auto-scrolls to bottom on new message)
- Messages styled differently by type:
  - `'chat'` → normal white text with player name prefix
  - `'correct'` → green background, "✓ [Name] guessed correctly!"
  - `'system'` → italic gray text (round start, game info)
- Input field at bottom + Send button
- If player is drawer: show "(You are drawing — no guessing!)" and disable input
- If player has already guessed: show "(You guessed correctly! 🎉)" and disable input
- Press Enter to send message

---

### FILE 12 — `client/src/components/Timer.jsx`

**Purpose:** Visual countdown timer bar shown during drawing phase.

**What to render:**
- A progress bar that shrinks from full width to zero
- Bar color transitions: green (>50%) → yellow (25–50%) → red (<25%)
- Numeric countdown in seconds shown inside or beside the bar
- Animated smooth transition using CSS transition on width

---

### FILE 13 — `client/src/components/Leaderboard.jsx`

**Purpose:** Shows live scores for all players.

**What to render:**
- List of players sorted by score (descending)
- Each row: rank number, avatar (colored circle), name, score
- Current drawer has a pencil icon next to their name
- Players who have guessed correctly get a ✓ checkmark
- Highlight the local player's row with a subtle background

---

### FILE 14 — `client/src/components/WordDisplay.jsx`

**Purpose:** Shows the word hint (dashes) to guessers, or the actual word to the drawer.

**What to render:**
- Row of individual letter boxes
- Each box is a blank square for unguessed letters (dash)
- Large font, centered, visually prominent
- If timeLeft < 20% of total: reveal one random letter as a hint

---

### FILE 15 — `client/src/components/PlayerList.jsx`

**Purpose:** Shows all players in the room with their avatar and status.

**What to render:**
- Each player: colored avatar circle with initials, username, score badge
- Crown icon next to room owner
- Pencil icon next to current drawer
- Gray out / show "(left)" for disconnected players

---

### FILE 16 — `client/src/pages/Home.jsx`

**Purpose:** Landing page where players enter their name, pick an avatar color, and either create a new room or join an existing one via room code.

**What to render:**
- Game title/logo
- Name input field
- Avatar color picker (8 color options)
- Two sections:
  - "Create Room" → settings panel (rounds, draw time, max players) + Create button
  - "Join Room" → room code input + Join button
- On create: emit `room:create` → navigate to `/room/:roomId`
- On join: emit `room:join` → navigate to `/room/:roomId` if success, else show error

---

### FILE 17 — `client/src/pages/Room.jsx`

**Purpose:** Main game page. Orchestrates all components together.

**Layout to build:**
```
┌─────────────────────────────────────────────────────┐
│  Round 2 of 3    [Timer Bar]    Guess This: _ _ _ _  │
├───────────────┬─────────────────┬────────────────────┤
│  PlayerList   │    Canvas       │    ChatBox         │
│  (left col)   │    (center)     │    (right col)     │
│               │                 │                    │
│               │  [ToolBar if    │                    │
│               │   drawer]       │                    │
├───────────────┴─────────────────┴────────────────────┤
│  If status='waiting': Show "Waiting for players..."  │
│  + Start Game button (only for room owner)           │
└─────────────────────────────────────────────────────┘
```

**Logic:**
- Uses `useGameSocket()` hook to get all game state
- Determines `isDrawer` by comparing socket.id to currentDrawer.id
- Passes correct props to each child component
- If `gameStatus === 'ended'`: navigate to `/gameover`
- On page unload / back navigation: emit `room:leave`

---

### FILE 18 — `client/src/pages/GameOver.jsx`

**Purpose:** Final screen shown after all rounds complete.

**What to render:**
- "Game Over!" heading
- Top 3 players on a podium (1st, 2nd, 3rd place positions)
- Full sorted leaderboard below
- Winner's name with a trophy animation
- "Play Again" button → emits `room:create` with same settings, navigates to new room
- "Go Home" button → navigates to `/`

---

### FILE 19 — `client/src/App.jsx`

**Purpose:** Root component. Sets up React Router with three routes.

**Routes:**
- `/` → `<Home />`
- `/room/:roomId` → `<Room />`
- `/gameover` → `<GameOver />`

---

### FILE 20 — `package.json` (root)

**Scripts to include:**
```json
{
  "scripts": {
    "server": "node server/index.js",
    "client": "cd client && npm run dev",
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "install:all": "npm install && cd client && npm install"
  }
}
```

---

## IMPORTANT POINTS (read these carefully before starting)

1. **Socket.io room isolation** — Use Socket.io's built-in room feature (`socket.join(roomId)`, `io.to(roomId).emit(...)`) to ensure events only go to players in the correct game room. Never broadcast globally.

2. **Canvas coordinate normalization** — The HTML canvas has two sizes: the CSS display size and the actual pixel buffer size. Always set `canvas.width` and `canvas.height` to the actual pixel dimensions (using `getBoundingClientRect()`), not just CSS. Otherwise drawings will appear at wrong positions on different screen sizes.

3. **Timer memory leaks** — Always store `setInterval` references in the `timers` Map (keyed by roomId) and call `clearInterval(timers.get(roomId))` before starting a new timer for the same room. Forgetting this causes multiple timers to run for the same room simultaneously.

4. **Canvas history for late joiners** — When a new player joins a room mid-drawing, send them the `canvasStrokes` array from `room.gameState` so they can replay all strokes and see the current canvas state.

5. **Correct guess security** — Word matching must happen ONLY on the server, never on the client. The client sends a raw message; the server checks if it matches the word. Never send the actual word to non-drawer clients.

6. **Drawer cannot guess** — On the server, when handling `chat:message`, always check if the sending player is the current drawer. If yes, broadcast their message normally but never check it against the word.

7. **Race condition on turn end** — When a turn ends (timer hits 0 OR all players guessed), set a `turnEnding` flag on the room to prevent both conditions from calling `endTurn()` simultaneously. Check this flag before calling `endTurn()`.

8. **Socket disconnect handling** — If the drawer disconnects mid-turn, the game should not freeze. In the `disconnect` handler, check if the leaving player was drawing and if so, call `endTurn()` immediately.

9. **Single socket instance** — In React, always use the singleton from `socket.js` — never create `io()` inside a component. Creating a new socket inside a component means a new connection is made every render.

10. **Environment variables** — Use `.env` for `PORT` and `CLIENT_URL` on the server side. Use `.env` in the client folder for `VITE_SERVER_URL`. Never hardcode `localhost:3001` in production code.

---

## CONCLUSION

This project covers the following skills and is suitable to add to your portfolio:

- Real-time bidirectional communication with Socket.io
- HTML5 Canvas API for collaborative drawing
- React custom hooks for separation of logic and UI
- Game state management without a database
- Multi-user room system with join/leave/reconnect handling
- Scoring algorithms and timer logic on the server

**Build order:** Follow files 1–20 in sequence. Each file builds on the previous. Do not skip the documentation block at the top of each file.

**After completing the MVP**, the following features can be added as enhancements:
- Public matchmaking (join random game)
- Persistent leaderboard with MongoDB
- Emoji reactions during drawing
- Replay mode (replay canvas strokes after turn ends)
- Mobile responsive layout with touch drawing support
- Custom word packs (import a word list as .txt)

**Start with File 1 now. Write the full code for `server/wordList.js` including the documentation block at the top.**
