import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PhoneFrame from './components/PhoneFrame.jsx'
import { LocaleProvider } from './lib/LocaleContext.jsx'
import { ThemeProvider } from './lib/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <LocaleProvider>
        <PhoneFrame>
          <App />
        </PhoneFrame>
      </LocaleProvider>
    </ThemeProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}
