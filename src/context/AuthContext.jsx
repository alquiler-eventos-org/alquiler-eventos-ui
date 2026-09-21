import { useState } from 'react'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('usuario')
        return stored ? JSON.parse(stored) : null
    })

    function login(email) {
        const usuarioSimulado = { email, nombre: 'Admin' }
        localStorage.setItem('usuario', JSON.stringify(usuarioSimulado))
        setUser(usuarioSimulado)
    }

    function logout() {
        localStorage.removeItem('usuario')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}