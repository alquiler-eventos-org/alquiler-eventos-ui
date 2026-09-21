import { apiCompras } from './client'

// Endpoints de Proveedores — microservicio ms-compras (contrato del openapi.yaml)
// La entidad simple de Setrini: CRUD completo + búsqueda + paginación.

export function listarProveedores({ page = 0, size = 10 } = {}) {
    return apiCompras.get('/proveedores', { params: { page, size } })
}

export function buscarProveedores({ nombre, page = 0, size = 10 } = {}) {
    return apiCompras.get('/proveedores/buscar', {
        params: { nombre, page, size },
    })
}

export function obtenerProveedor(id) {
    return apiCompras.get(`/proveedores/${id}`)
}

export function crearProveedor(request) {
    return apiCompras.post('/proveedores', request)
}

export function actualizarProveedor(id, request) {
    return apiCompras.put(`/proveedores/${id}`, request)
}

// Borrado lógico: el servidor marca activo=false, no borra la fila.
export function eliminarProveedor(id) {
    return apiCompras.delete(`/proveedores/${id}`)
}
