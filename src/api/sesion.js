// Manejo de la sesión (JWT) en el navegador.
// El token se guarda en localStorage; el usuario se obtiene decodificando su
// payload (el JWT del ms-seguridad trae: sub = email, uid, roles, exp).

const KEY_TOKEN = 'token'

export function decodificarJwt(token) {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
        atob(payload)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
    )
    return JSON.parse(json)
}

export function usuarioDesdeToken(token) {
    const claims = decodificarJwt(token)
    return {
        email: claims.sub,
        nombre: claims.sub.split('@')[0],
        roles: claims.roles ?? [],
        uid: claims.uid,
        exp: claims.exp,
    }
}

export function getToken() {
    return localStorage.getItem(KEY_TOKEN)
}

export function guardarSesion(token) {
    localStorage.setItem(KEY_TOKEN, token)
}

export function borrarSesion() {
    localStorage.removeItem(KEY_TOKEN)
    localStorage.removeItem('usuario') // clave del login simulado anterior
}

// Devuelve { token, user } si hay un token válido y no vencido; si no, null.
export function leerSesion() {
    const token = getToken()
    if (!token) return null
    try {
        const user = usuarioDesdeToken(token)
        if (user.exp * 1000 <= Date.now()) {
            borrarSesion()
            return null
        }
        return { token, user }
    } catch {
        borrarSesion()
        return null
    }
}

// Roles que el backend permite en cada módulo (mismas reglas que ms-alquiler,
// ms-compras y ms-seguridad). Sin lista = cualquier usuario logueado.
export const ROLES = {
    alquiler: ['ADMIN', 'ENCARGADO_DEPOSITO'],
    compras: ['ADMIN', 'ENCARGADO_COMPRAS'],
    seguridad: ['ADMIN'],
}

// true si el usuario tiene alguno de los roles pedidos (o si no se pide ninguno).
export function tieneRol(user, permitidos) {
    if (!permitidos || permitidos.length === 0) return true
    return permitidos.some((rol) => user?.roles?.includes(rol))
}
