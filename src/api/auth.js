import { apiSeguridad } from './client'

// POST /auth/login (ms-seguridad). Respuesta: { accessToken, tokenType, expiresIn }
export function iniciarSesion(email, password) {
    return apiSeguridad.post('/auth/login', { email, password })
}
