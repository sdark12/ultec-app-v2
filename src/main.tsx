// --- src/main.tsx ---
// Asegúrate que StrictMode esté activo (descomentado) para probar
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode> {/* <-- Descomentado para probar compatibilidad */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)