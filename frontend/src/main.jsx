import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CampaignProvider } from './context/CampaignContext.jsx'
import { CreditsProvider } from './context/CreditContext.jsx'
import { PlansProvider } from './context/PlanContext.jsx'
import { SessionProvider } from './context/SessionContext.jsx'
import { UserProvider } from './context/UserContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          <PlansProvider>
            <CreditsProvider>
              <SessionProvider>
                <CampaignProvider>
                  <App />
                </CampaignProvider>
              </SessionProvider>
            </CreditsProvider>
          </PlansProvider>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
