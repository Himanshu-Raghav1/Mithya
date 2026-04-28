import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx'

// Fire a background request immediately to warm up the backend DB connection pool
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
fetch(`${API_URL}/api/wakeup`).catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
