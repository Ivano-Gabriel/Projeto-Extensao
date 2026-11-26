import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './escola/escola.css'
import './prime-v2.css'
import './zelo-redesign-v2.css'
import './ux-ajustes-finais.css'
import './portal-nav-v4.css'
import './portal/implantacao.css'
import './portal/experiencia.css'
import './portal/formularios-seguros.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {scope: import.meta.env.BASE_URL})
      .catch(() => {  })
  })
}
