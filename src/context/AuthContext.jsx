import { useState } from 'react'
import { AuthContext } from './auth-context'
import { iniciarSesion } from '../api/auth'
import { borrarSesion, guardarSesion, leerSesion, usuarioDesdeToken } from '../api/sesion'

export function AuthProvider({ children }) {
    // Al recargar la página se recupera la sesión si el token sigue vigente.
    const [user, setUser] = useState(() => leerSesion()?.user ?? null)

    // Login real contra ms-seguridad. Si falla, la excepción llega al formulario.
    async function login(email, password) {
        const { data } = await iniciarSesion(email, password)
        guardarSesion(data.accessToken)
        const usuario = usuarioDesdeToken(data.accessToken)
        setUser(usuario)
        return usuario
    }

    function logout() {
        borrarSesion()
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
