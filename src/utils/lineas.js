// Helpers del editor de líneas de órdenes (alquiler y compra).

export const LINEA_VACIA = { equipoId: '', cantidad: 1, costoUnitario: '' }

// Convierte las líneas del formulario al formato que espera la API.
export function lineasADetalles(lineas, conCosto = false) {
    return lineas
        .filter((l) => l.equipoId !== '')
        .map((l) => ({
            equipoId: Number(l.equipoId),
            cantidad: Number(l.cantidad),
            ...(conCosto ? { costoUnitario: Number(l.costoUnitario) } : {}),
        }))
}
