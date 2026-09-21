import { createContext } from 'react'

// El contexto vive en un archivo propio para cumplir la regla de fast-refresh.
export const AuthContext = createContext(null)
