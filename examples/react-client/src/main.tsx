import React from 'react';
import ReactDOM from 'react-dom/client';
import { SecureStackProvider } from '@lemur-bookstores/client/react';
import App from './App';
import './index.css';

const config = {
  url: 'http://localhost:3000/api', // Pointing to our server example
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SecureStackProvider config={config}>
      <App />
    </SecureStackProvider>
  </React.StrictMode>
);
