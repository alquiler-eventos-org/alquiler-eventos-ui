import { apiAlquiler } from './client'

// Endpoints de Clientes — microservicio ms-alquiler (contrato del openapi.yaml)
// La entidad simple de Tobi: CRUD completo + búsqueda + paginación.
// Mientras el ms de Tobi no esté corriendo, la pantalla muestra el error amigable.

export function listarClientes({ page = 0, size = 10 } = {}) {
    return apiAlquiler.get('/clientes', { params: { page, size } })
}

export function buscarClientes({ nombre, apellido, documento, email, page = 0, size = 10 } = {}) {
    return apiAlquiler.get('/clientes/buscar', {
        params: { nombre, apellido, documento, email, page, size },
    })
}

export function obtenerCliente(id) {
    return apiAlquiler.get(`/clientes/${id}`)
}

export function crearCliente(request) {
    return apiAlquiler.post('/clientes', request)
}

export function actualizarCliente(id, request) {
    return apiAlquiler.put(`/clientes/${id}`, request)
}

// Borrado lógico: el servidor marca activo=false, no borra la fila.
export function eliminarCliente(id) {
    return apiAlquiler.delete(`/clientes/${id}`)
}
