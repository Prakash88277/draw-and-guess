/**
 * FILE DOCUMENTATION BLOCK
 * 
 * What this file does:
 * React root render point.
 * 
 * Functions inside: None
 * 
 * Dependencies:
 * - react
 * - react-dom
 * - client/src/App.jsx
 * - client/src/index.css
 * 
 * Dependents:
 * - client/index.html
 * 
 * Current state: complete
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
