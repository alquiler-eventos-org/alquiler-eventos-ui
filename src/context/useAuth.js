import { useContext } from 'react'
import { AuthContext } from './auth-context'

// Hook separado del provider para que el fast refresh de Vite funcione bien.
export function useAuth() {
    return useContext(AuthContext)
}
