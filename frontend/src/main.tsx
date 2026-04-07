import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './style.css'
import { NotificationProvider } from './context/NotificationContext.tsx'

createRoot(document.getElementById('app')!).render(
    <StrictMode>
        <NotificationProvider>
            <App />
        </NotificationProvider>
    </StrictMode>,
)
