import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// import TestApp from './TestApp.tsx'

// Registra Service Worker per notifiche push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered successfully:', registration);
      
      // Ascolta messaggi dal Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, url, data } = event.data;
        
        if (type === 'notification_click') {
          // Naviga alla URL specificata
          if (url) {
            window.location.href = url;
          }
        }
      });
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
