/**
 * Main entry point for the React application.
 * Mounts the root App component to the DOM and initializes global styles.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// StrictMode is useful for highlighting potential problems in an application.
// Note: In R3F, StrictMode might cause double-rendering of 3D scenes in development,
// but it does not affect the production build.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);