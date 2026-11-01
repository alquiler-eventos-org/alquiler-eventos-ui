import { useSyncExternalStore } from 'react'
import { obtenerLogo } from '../api/configuracion'

// El logotipo vive en el backend (lo cambia el ADMIN). Se guarda una copia en el
// navegador para mostrarlo al instante y también en el login, antes de iniciar sesión.

const KEY = 'logo-sistema'
const EVENTO = 'logo-cambiado'
let sincronizado = false

export function leerLogo() {
    try {
        return localStorage.getItem(KEY) || null
    } catch {
        return null
    }
}

export function guardarLogoLocal(dataUrl) {
    try {
        if (dataUrl) localStorage.setItem(KEY, dataUrl)
        else localStorage.removeItem(KEY)
    } catch {
        // sin almacenamiento: el logo igual se ve en esta sesión al recargar desde el servidor
    }
    window.dispatchEvent(new Event(EVENTO))
}

function suscribir(avisar) {
    window.addEventListener(EVENTO, avisar)
    window.addEventListener('storage', avisar)
    return () => {
        window.removeEventListener(EVENTO, avisar)
        window.removeEventListener('storage', avisar)
    }
}

export function useLogo() {
    return useSyncExternalStore(suscribir, leerLogo, () => null)
}

// Trae el logo del servidor una vez por carga de la app (después de iniciar sesión).
export function sincronizarLogo() {
    if (sincronizado) return
    sincronizado = true
    obtenerLogo()
        .then((resp) => guardarLogoLocal(resp.data?.logo ?? null))
        .catch(() => {
            sincronizado = false
        })
}
