import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './i18n'; // Correct relative path (assuming index.tsx and i18n.ts are both in src/)

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
