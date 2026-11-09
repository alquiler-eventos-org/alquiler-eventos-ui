import { AuthProvider } from './context/AuthContext'
import { ConfirmarProvider } from './context/ConfirmarProvider'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
      <AuthProvider>
        <ConfirmarProvider>
          <AppRoutes />
        </ConfirmarProvider>
      </AuthProvider>
  )
}

export default App
