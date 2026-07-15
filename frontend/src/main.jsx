import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Import CSS Stylesheets in order
import './styles/variables.css';
import './styles/global.css';
import './styles/glassmorphism.css';
import './styles/neon.css';
import './styles/animations.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
