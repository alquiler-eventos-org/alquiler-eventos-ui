// Cálculos del Dashboard y de Reportes a partir de las órdenes de alquiler y
// los equipos que devuelve la API (no hay endpoints de reportes propios).

import { listarOrdenesAlquiler } from '../api/ordenesAlquiler'
import { listarEquipos } from '../api/equipos'
import { listarOrdenesCompra } from '../api/ordenesCompra'
import { normalizarPagina } from '../api/client'

export const STOCK_BAJO = 2

// Trae lo que el rol del usuario puede ver. Lo que falla o no corresponde
// queda en null y la pantalla muestra "—" en vez de romperse.
export async function cargarResumen({ alquiler, compras }) {
    const r = { ordenes: null, equipos: null, comprasMes: null }
    const tareas = []
    if (alquiler) {
        tareas.push(
            listarOrdenesAlquiler({ page: 0, size: 500 })
                .then((x) => {
                    r.ordenes = normalizarPagina(x.data).contenido
                })
                .catch(() => {}),
            listarEquipos({})
                .then((x) => {
                    r.equipos = normalizarPagina(x.data).contenido
                })
                .catch(() => {}),
        )
    }
    if (compras) {
        tareas.push(
            listarOrdenesCompra({ page: 0, size: 200 })
                .then((x) => {
                    const mes = mesActual()
                    r.comprasMes = normalizarPagina(x.data).contenido.filter(
                        (o) => o.estado !== 'ANULADA' && claveMes(o.fechaCompra) === mes,
                    ).length
                })
                .catch(() => {}),
        )
    }
    await Promise.all(tareas)
    return r
}

// ---------- Fechas locales (no UTC: de noche toISOString() ya devuelve el día siguiente) ----------
export function fechaISO(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function hoyISO() {
    return fechaISO(new Date())
}

export function primerDiaMesISO() {
    const h = new Date()
    return fechaISO(new Date(h.getFullYear(), h.getMonth(), 1))
}

export function ultimoDiaMesISO() {
    const h = new Date()
    return fechaISO(new Date(h.getFullYear(), h.getMonth() + 1, 0))
}

// true si la fecha ("2026-11-05") cae dentro del rango; desde/hasta vacíos = sin límite.
export function enRango(fecha, desde, hasta) {
    const f = (fecha ?? '').slice(0, 10)
    if (!f) return false
    if (desde && f < desde) return false
    if (hasta && f > hasta) return false
    return true
}

export function claveMes(fecha) {
    return (fecha ?? '').slice(0, 7) // "2026-10"
}

export function mesActual() {
    const hoy = new Date()
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
}

const vigentes = (ordenes) => ordenes.filter((o) => o.estado !== 'ANULADA')

export function ingresosDelMes(ordenes, mes = mesActual()) {
    return vigentes(ordenes)
        .filter((o) => claveMes(o.fechaEvento) === mes)
        .reduce((acc, o) => acc + Number(o.total ?? 0), 0)
}

export function ordenesDelMes(ordenes, mes = mesActual()) {
    return vigentes(ordenes).filter((o) => claveMes(o.fechaEvento) === mes).length
}

export function contarEstado(ordenes, ...estados) {
    return ordenes.filter((o) => estados.includes(o.estado)).length
}

// Unidades de equipo que están afuera ahora (órdenes en ENTREGA o MORA).
export function equiposAfuera(ordenes, ...estados) {
    const buscados = estados.length ? estados : ['ENTREGA', 'MORA']
    return ordenes
        .filter((o) => buscados.includes(o.estado))
        .reduce((acc, o) => acc + (o.detalles ?? []).reduce((s, l) => s + Number(l.cantidad ?? 0), 0), 0)
}

// Últimos `cantidad` meses (el actual al final) con su ingreso.
export function ingresosPorMes(ordenes, cantidad = 6) {
    const hoy = new Date()
    const meses = []
    for (let i = cantidad - 1; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
        const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const nombre = d.toLocaleDateString('es-PY', { month: 'long' })
        meses.push({
            mes: nombre.charAt(0).toUpperCase() + nombre.slice(1),
            clave,
            valor: ingresosDelMes(ordenes, clave),
        })
    }
    return meses
}

// Equipos alquilados (unidades e ingreso) en las órdenes no anuladas, de mayor a menor ingreso.
export function equiposMasAlquilados(ordenes, limite = 5) {
    const acc = new Map()
    for (const o of vigentes(ordenes)) {
        for (const l of o.detalles ?? []) {
            const nombre = l.equipoNombre ?? `Equipo #${l.equipoId}`
            const previo = acc.get(nombre) ?? { equipo: nombre, veces: 0, unidades: 0, ingreso: 0 }
            previo.veces += 1
            previo.unidades += Number(l.cantidad ?? 0)
            previo.ingreso += Number(l.subtotal ?? 0)
            acc.set(nombre, previo)
        }
    }
    return [...acc.values()].sort((a, b) => b.ingreso - a.ingreso).slice(0, limite)
}
