import { apiAlquiler } from './client'

// Endpoints de Clientes — microservicio ms-alquiler (contrato del openapi.yaml)
// La entidad simple de Tobi: CRUD completo + búsqueda + paginación.
// Mientras el ms de Tobi no esté corriendo, la pantalla muestra el error amigable.

// El backend filtra con AND entre todos los parámetros, así que la caja de
// búsqueda única se traduce a UN filtro según lo que escribió el usuario.
function filtrosDeBusqueda(texto) {
    const t = (texto ?? '').trim()
    if (!t) return {}
    if (t.includes('@')) return { email: t }
    if (/^[\d.-]+$/.test(t)) return { documento: t }
    const partes = t.split(/\s+/)
    if (partes.length > 1) return { nombre: partes[0], apellido: partes.slice(1).join(' ') }
    return { nombre: t }
}

export async function listarClientes({ page = 0, size = 10, busqueda } = {}) {
    const filtros = filtrosDeBusqueda(busqueda)
    const consultar = (extra) =>
        apiAlquiler.get('/clientes/buscar', { params: { page, size, ...extra } })
    const resp = await consultar(filtros)
    // Una sola palabra sin resultados como nombre: se prueba como apellido.
    if (filtros.nombre && !filtros.apellido && resp.data?.totalElements === 0) {
        return consultar({ apellido: filtros.nombre })
    }
    return resp
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
