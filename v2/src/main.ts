import React from 'react';
import ReactDOM from 'react-dom/client';
import { Terminal } from './Terminal';
import './styles.css';

// Initialize the app
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  React.createElement(Terminal)
);

// Simple console message
console.log('🚀 Fadi\'s AI Terminal - Ready');
console.log('💡 Ask questions about experience, skills, or projects');