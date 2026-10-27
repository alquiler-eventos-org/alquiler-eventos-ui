import { apiAlquiler } from './client'

// Equipos — ms-alquiler (GET /equipos, solo lectura; requiere el endpoint nuevo
// del backend). Cada equipo: { id, nombre, categoriaId, categoria, stock, precioDia, estado }
export function listarEquipos({ page = 0, size = 200 } = {}) {
    return apiAlquiler.get('/equipos', { params: { page, size, sort: 'id,asc' } })
}

export function obtenerEquipo(id) {
    return apiAlquiler.get(`/equipos/${id}`)
}
