import { apiAlquiler } from './client'

// Equipos — ms-alquiler (GET /equipos, solo lectura; requiere el endpoint nuevo
// del backend). Cada equipo: { id, nombre, categoriaId, categoria, stock, precioDia, estado }
export function listarEquipos({ page = 0, size = 200 } = {}) {
    return apiAlquiler.get('/equipos', { params: { page, size, sort: 'id,asc' } })
}

export function obtenerEquipo(id) {
    return apiAlquiler.get(`/equipos/${id}`)
}

// Catálogo de categorías para el select: [{ id, nombre }]
export function listarCategorias() {
    return apiAlquiler.get('/categorias')
}

// { nombre, categoriaId, stock, precioDia, estado } (estado opcional: DISPONIBLE por defecto)
export function crearEquipo(request) {
    return apiAlquiler.post('/equipos', request)
}

export function actualizarEquipo(id, request) {
    return apiAlquiler.put(`/equipos/${id}`, request)
}

// Baja lógica: el equipo queda en estado BAJA.
export function darDeBajaEquipo(id) {
    return apiAlquiler.delete(`/equipos/${id}`)
}
