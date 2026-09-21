import { apiCompras } from './client'

// Endpoints de Órdenes de Compra — microservicio ms-compras (contrato del openapi.yaml)
// Cabecera-detalle: OrdenCompra + OrdenCompraDetalle (la M:N con Equipo).
// El servidor calcula subtotales y total; el cliente NO los manda.

export function listarOrdenesCompra({ page = 0, size = 10, filtros = {} } = {}) {
    return apiCompras.get('/ordenes-compra', { params: { page, size, ...filtros } })
}

export function obtenerOrdenCompra(id) {
    return apiCompras.get(`/ordenes-compra/${id}`)
}

export function crearOrdenCompra(request) {
    return apiCompras.post('/ordenes-compra', request)
}

export function actualizarOrdenCompra(id, request) {
    return apiCompras.put(`/ordenes-compra/${id}`, request)
}

// Transiciones válidas: PENDIENTE->CONFIRMADA, CONFIRMADA->RECIBIDA,
// PENDIENTE->ANULADA (borrado lógico). El backend valida y guarda historial.
export function cambiarEstadoOrdenCompra(id, estado) {
    return apiCompras.put(`/ordenes-compra/${id}/estado`, { estado })
}

// Borrado lógico: estado ANULADA (solo permitido si está PENDIENTE).
export function anularOrdenCompra(id) {
    return apiCompras.delete(`/ordenes-compra/${id}`)
}
