import axios from 'axios'

/**
 * Clientes axios, uno por microservicio.
 *
 * Ambos pasan por el API GATEWAY (puerto 8080), que enruta a cada
 * microservicio via Eureka (lb://). En desarrollo Vite hace de proxy
 * (ver vite.config.js): el navegador llama a /ms/compras/... o
 * /ms/alquiler/... y Vite lo reenvia al Gateway http://localhost:8080/api/...
 * Para apuntar a otra URL (ej. backend desplegado) definí
 * VITE_API_COMPRAS / VITE_API_ALQUILER en un .env.local
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
        return 'No hay conexión con el API Gateway. ¿Están corriendo Eureka, los microservicios y el gateway?'
    }
    return error.response?.data?.mensaje ?? fallback
}

/**
 * Normaliza la respuesta a la forma de página que usa el proyecto:
 * { contenido, totalElementos, numeroPagina, tamanoPagina }
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
    // Spring Page (ms-alquiler devuelve Page<Cliente> de Spring Data)
    if (data && Array.isArray(data.content)) {
        return {
            contenido: data.content,
            totalElementos: data.totalElements ?? data.content.length,
            numeroPagina: data.number ?? page,
            tamanoPagina: data.size ?? size,
        }
    }
    return (
        data ?? { contenido: [], totalElementos: 0, numeroPagina: page, tamanoPagina: size }
    )
}
