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

// El backend valida el cuerpo completo, incluidos los roles actuales.
// Siempre guarda la contraseña que llega, por eso la UI la pide al editar.
export function actualizarUsuario(id, { nombre, email, password, roles }) {
    return apiSeguridad.put(`/usuarios/${id}`, { nombre, email, password, roles })
}

// { roles: ['ENCARGADO_COMPRAS', ...] }
export function asignarRoles(id, roles) {
    return apiSeguridad.put(`/usuarios/${id}/roles`, { roles })
}

// Baja lógica: el usuario queda inactivo y ya no puede iniciar sesión.
export function desactivarUsuario(id) {
    return apiSeguridad.delete(`/usuarios/${id}`)
}
