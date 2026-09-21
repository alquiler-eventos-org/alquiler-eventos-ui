// Componentes UI compartidos con el estilo del proyecto:
// cards blancas rounded-xl, bordes gray-200, acento blue-600.

// ---------- Badge de estado ----------
const badgeColors = {
    PENDIENTE: 'bg-yellow-100 text-yellow-700',
    CONFIRMADA: 'bg-blue-100 text-blue-600',
    RECIBIDA: 'bg-green-100 text-green-600',
    ANULADA: 'bg-red-100 text-red-600',
    RESERVA: 'bg-gray-100 text-gray-600',
    ENTREGA: 'bg-blue-100 text-blue-600',
    DEVOLUCION: 'bg-green-100 text-green-600',
    MORA: 'bg-red-100 text-red-600',
}

export function Badge({ estado }) {
    const color = badgeColors[estado] ?? 'bg-gray-100 text-gray-600'
    return (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${color}`}>
            {estado}
        </span>
    )
}

// ---------- Modal simple ----------
export function Modal({ abierto, titulo, children, onCerrar, ancho = 'max-w-md' }) {
    if (!abierto) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onCerrar}
                aria-hidden="true"
            />
            <div className={`relative bg-white rounded-xl shadow-lg w-full ${ancho} max-h-[90vh] overflow-y-auto`}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-900">{titulo}</h2>
                    <button
                        onClick={onCerrar}
                        className="text-gray-400 hover:text-gray-700 text-lg leading-none"
                        aria-label="Cerrar"
                    >
                        ×
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    )
}

// ---------- Paginación ----------
export function Paginacion({ pagina, totalPaginas, onCambiar }) {
    if (totalPaginas <= 1) return null
    return (
        <div className="flex items-center justify-end gap-2 mt-4 text-sm">
            <button
                disabled={pagina === 0}
                onClick={() => onCambiar(pagina - 1)}
                className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Anterior
            </button>
            <span className="text-gray-500 text-xs">
                Página {pagina + 1} de {totalPaginas}
            </span>
            <button
                disabled={pagina >= totalPaginas - 1}
                onClick={() => onCambiar(pagina + 1)}
                className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Siguiente
            </button>
        </div>
    )
}

// ---------- Campos de formulario ----------
export function Campo({ label, children }) {
    return (
        <label className="block mb-4">
            <span className="block text-xs text-gray-500 mb-1">{label}</span>
            {children}
        </label>
    )
}

export const inputCls =
    'w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-sm outline-none focus:border-blue-500 focus:bg-white'

// ---------- Botones ----------
export function BotonPrimario({ children, ...props }) {
    return (
        <button
            {...props}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
            {children}
        </button>
    )
}

export function BotonSecundario({ children, ...props }) {
    return (
        <button
            {...props}
            className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition"
        >
            {children}
        </button>
    )
}

// ---------- Helpers compartidos ----------
// Clases del input de filtro (búsqueda) usado en el encabezado de las tablas
export const filtroCls =
    'border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:border-blue-500 focus:bg-white'

// ---------- Estados de tabla ----------
export function ErrorBanner({ mensaje, onReintentar }) {
    return (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
            <span>{mensaje}</span>
            {onReintentar && (
                <button onClick={onReintentar} className="underline text-xs">
                    Reintentar
                </button>
            )}
        </div>
    )
}

export function SinDatos({ mensaje = 'No hay registros para mostrar.' }) {
    return <p className="text-sm text-gray-400 text-center py-8">{mensaje}</p>
}

export function Cargando() {
    return <p className="text-sm text-gray-400 text-center py-8">Cargando…</p>
}
