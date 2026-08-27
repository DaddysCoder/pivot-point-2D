import { BrowserRouter } from 'react-router-dom'
import { GameProvider } from '@/app/GameProvider'
import { AppRoutes } from '@/app/routes'

export function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <div className="pp-shell min-h-screen" id="main">
          <AppRoutes />
        </div>
      </GameProvider>
    </BrowserRouter>
  )
}
