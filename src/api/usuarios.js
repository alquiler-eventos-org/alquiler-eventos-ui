import { apiSeguridad } from './client'

// Usuarios y roles — ms-seguridad (solo ADMIN).
// GET /usuarios requiere el endpoint de listado nuevo del backend.
export function listarUsuarios() {
    return apiSeguridad.get('/usuarios')
}

export function listarRoles() {
    return apiSeguridad.get('/roles')
}

// { nombre, email, password, roles: ['ADMIN', ...] }
export function crearUsuario(request) {
    return apiSeguridad.post('/usuarios', request)
}

// { roles: ['ENCARGADO_COMPRAS', ...] }
export function asignarRoles(id, roles) {
    return apiSeguridad.put(`/usuarios/${id}/roles`, { roles })
}

// Baja lógica: el usuario queda inactivo y ya no puede iniciar sesión.
export function desactivarUsuario(id) {
    return apiSeguridad.delete(`/usuarios/${id}`)
}
