import axios from 'axios'

/**
 * Clientes axios, uno por microservicio.
 * - ms-compras  -> Proveedores y Órdenes de Compra (puerto 8082)
 * - ms-alquiler -> Clientes y Órdenes de Alquiler (puerto 8081)
 *
 * En desarrollo Vite hace de proxy (ver vite.config.js): el navegador llama a
 * /ms/compras/... y Vite lo reenvía a http://localhost:8082/api/...
 * Para apuntar a otra URL (ej. backend desplegado) definí VITE_API_COMPRAS /
 * VITE_API_ALQUILER en un .env.local
 */
export const apiCompras = axios.create({
    baseURL: import.meta.env.VITE_API_COMPRAS ?? '/ms/compras',
    timeout: 15000,
})

export const apiAlquiler = axios.create({
    baseURL: import.meta.env.VITE_API_ALQUILER ?? '/ms/alquiler',
    timeout: 15000,
})

/**
 * Extrae el mensaje legible de un error HTTP usando el formato ApiError del
 * JAR common: { codigo, mensaje, ruta, fecha }.
 */
export function mensajeDeError(error, fallback = 'Ocurrió un error inesperado') {
    if (!error?.response) {
        return 'No hay conexión con el microservicio. ¿Está corriendo?'
    }
    return error.response?.data?.mensaje ?? fallback
}

/**
 * Normaliza la respuesta a la forma de página que usa el proyecto:
 * { contenido, totalElementos, numeroPagina, tamanoPagina }
 * Útil mientras algún microservicio todavía devuelve un array plano.
 */
export function normalizarPagina(data, page = 0, size = 10) {
    if (Array.isArray(data)) {
        return {
            contenido: data,
            totalElementos: data.length,
            numeroPagina: page,
            tamanoPagina: size,
        }
    }
    return (
        data ?? { contenido: [], totalElementos: 0, numeroPagina: page, tamanoPagina: size }
    )
}
