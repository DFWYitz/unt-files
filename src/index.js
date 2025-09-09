// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './componants/App.jsx';

// Import CSS styles
import './styles/main.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<App />);