import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Backdrop } from './components/Effects.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Backdrop />
    <App />
  </React.StrictMode>,
)
