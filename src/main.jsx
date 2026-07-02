import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PhoneFrame from './components/PhoneFrame.jsx'
import { LocaleProvider } from './lib/LocaleContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LocaleProvider>
      <PhoneFrame>
        <App />
      </PhoneFrame>
    </LocaleProvider>
  </StrictMode>,
)
