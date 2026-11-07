import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './escola/escola.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Somente no build publicado; evita conflito de service workers com Vite dev.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {scope: import.meta.env.BASE_URL})
      .catch(() => { /* Offline e opcional; o app continua funcionando online. */ })
  })
}
