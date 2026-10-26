import { apiAlquiler } from './client'

// Endpoints de Órdenes de alquiler — ms-alquiler (via el API Gateway).
// Roles permitidos en el backend: ADMIN y ENCARGADO_DEPOSITO.

// Lista paginada (server-side). `estado` es opcional: RESERVA, ENTREGA, DEVOLUCION, MORA, ANULADA.
// Cada orden ya trae sus `detalles` (equipoNombre, cantidad, dias, precioDia, subtotal).
export function listarOrdenesAlquiler({ page = 0, size = 6, estado } = {}) {
    const params = { page, size }
    if (estado) params.estado = estado
    return apiAlquiler.get('/ordenes-alquiler/buscar', { params })
}

export function obtenerOrdenAlquiler(id) {
    return apiAlquiler.get(`/ordenes-alquiler/${id}`)
}

// Cambia el estado. El usuario que lo hace sale del JWT (claim uid), no del cuerpo.
// ENTREGA descuenta stock, DEVOLUCION lo devuelve, MORA calcula el monto de mora.
export function cambiarEstadoOrdenAlquiler(id, estado) {
    return apiAlquiler.put(`/ordenes-alquiler/${id}/estado`, { estado })
}

// Transiciones válidas del backend (RESERVA->ENTREGA|ANULADA, ENTREGA->DEVOLUCION|MORA, MORA->DEVOLUCION).
export const TRANSICIONES = {
    RESERVA: ['ENTREGA', 'ANULADA'],
    ENTREGA: ['DEVOLUCION', 'MORA'],
    MORA: ['DEVOLUCION'],
    DEVOLUCION: [],
    ANULADA: [],
}
