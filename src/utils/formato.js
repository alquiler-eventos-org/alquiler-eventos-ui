// Utilitarios de formato compartidos (no son componentes, por eso van acá).

// Formatea un número como Guaraníes: 350000 -> "₲ 350.000"
export function formatoGs(valor) {
    return `₲ ${Number(valor ?? 0).toLocaleString('es-PY')}`
}

// "2026-11-05" -> "05/11/2026" (las fechas llegan como ISO y se muestran dd/mm/aaaa)
export function formatoFecha(iso) {
    if (!iso) return '—'
    const [a, m, d] = String(iso).slice(0, 10).split('-')
    return d && m && a ? `${d}/${m}/${a}` : String(iso)
}

// Texto corto de los equipos de una orden: "Parlante JBL ×2, Bafle ×1"
export function resumenEquipos(items) {
    if (!items || items.length === 0) return '—'
    const txt = items.map((i) => `${i.nombre} ×${i.cantidad}`).join(', ')
    return txt.length > 60 ? `${txt.slice(0, 57)}…` : txt
}
