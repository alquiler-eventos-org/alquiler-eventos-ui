import axios from 'axios'
import { borrarSesion, getToken } from './sesion'

/**
 * Clientes axios, uno por microservicio.
 *
 * Todos pasan por el API GATEWAY (puerto 8080), que enruta a cada
 * microservicio via Eureka (lb://). En desarrollo Vite hace de proxy
 * (ver vite.config.js): el navegador llama a /ms/seguridad/..., /ms/compras/...
 * o /ms/alquiler/... y Vite lo reenvia al Gateway http://localhost:8080/api/...
 * Para apuntar a otra URL (ej. backend desplegado) definí
 * VITE_API_SEGURIDAD / VITE_API_COMPRAS / VITE_API_ALQUILER en un .env.local
 */
function crearCliente(baseURL) {
    const api = axios.create({ baseURL, timeout: 15000 })

    // Adjunta el JWT en cada pedido: Authorization: Bearer <token>
    api.interceptors.request.use((config) => {
        const token = getToken()
        if (token) config.headers.Authorization = `Bearer ${token}`
        return config
    })

    // 401 (token vencido o inválido) => se cierra la sesión y vuelve al login.
    // El propio /auth/login queda afuera: ahí un 401 significa credenciales malas.
    api.interceptors.response.use(
        (respuesta) => respuesta,
        (error) => {
            const esLogin = error.config?.url?.includes('/auth/login')
            if (error.response?.status === 401 && !esLogin) {
                borrarSesion()
                window.location.assign('/login')
            }
            return Promise.reject(error)
        },
    )
    return api
}

export const apiSeguridad = crearCliente(import.meta.env.VITE_API_SEGURIDAD ?? '/ms/seguridad')
export const apiCompras = crearCliente(import.meta.env.VITE_API_COMPRAS ?? '/ms/compras')
export const apiAlquiler = crearCliente(import.meta.env.VITE_API_ALQUILER ?? '/ms/alquiler')

/**
 * Extrae el mensaje legible de un error HTTP usando el formato ApiError del
 * JAR common: { codigo, mensaje, ruta, fecha }.
 */
export function mensajeDeError(error, fallback = 'Ocurrió un error inesperado') {
    const respuesta = error?.response
    // Sin respuesta, o error del proxy/gateway sin cuerpo: el backend no está arriba.
    if (!respuesta || (respuesta.status >= 500 && !respuesta.data?.mensaje)) {
        return 'No hay conexión con el API Gateway. ¿Están corriendo Eureka, los microservicios y el gateway?'
    }
    if (respuesta.status === 403) {
        return respuesta.data?.mensaje ?? 'No posee permisos para este recurso'
    }
    return respuesta.data?.mensaje ?? fallback
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
