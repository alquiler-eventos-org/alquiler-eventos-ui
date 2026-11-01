import { apiAlquiler } from './client'

// Configuración del sistema — ms-alquiler (via el API Gateway), separada por rol:
//  - /configuracion/alquiler  -> ADMIN y ENCARGADO_DEPOSITO
//  - /categorias (alta/edición/baja) -> ADMIN y ENCARGADO_COMPRAS
//  - /configuracion/logo (cambiar) -> solo ADMIN; verlo, cualquier rol

// { tarifaMoraDia, diasAnticipacion, plantillaEmail }
export function obtenerConfigAlquiler() {
    return apiAlquiler.get('/configuracion/alquiler')
}

export function guardarConfigAlquiler(request) {
    return apiAlquiler.put('/configuracion/alquiler', request)
}

// Dispara ahora el mismo proceso que corre el cron diario.
// Devuelve { fechaObjetivo, ordenes, enviados, simulados, sinEmail, errores, smtpConfigurado }
export function ejecutarRecordatorios() {
    return apiAlquiler.post('/configuracion/recordatorios/ejecutar')
}

// { logo: "data:image/png;base64,..." | null }
export function obtenerLogo() {
    return apiAlquiler.get('/configuracion/logo')
}

export function guardarLogo(logo) {
    return apiAlquiler.put('/configuracion/logo', { logo })
}

export function borrarLogo() {
    return apiAlquiler.delete('/configuracion/logo')
}

// Categorías de equipos: { id, nombre }
export function crearCategoria(nombre) {
    return apiAlquiler.post('/categorias', { nombre })
}

export function actualizarCategoria(id, nombre) {
    return apiAlquiler.put(`/categorias/${id}`, { nombre })
}

export function eliminarCategoria(id) {
    return apiAlquiler.delete(`/categorias/${id}`)
}
