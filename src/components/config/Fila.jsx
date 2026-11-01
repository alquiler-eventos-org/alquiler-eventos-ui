// Fila de configuración: título + descripción a la izquierda, control a la derecha.
// Con `ancha` el control va debajo y ocupa todo el ancho (plantillas largas, listas).
export default function Fila({ titulo, descripcion, ancha = false, children }) {
    return (
        <div
            className={`bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-6 grid gap-4 ${
                ancha ? '' : 'sm:grid-cols-[19rem_1fr] sm:items-center'
            }`}
        >
            <div>
                <p className="text-sm font-semibold text-gray-900">{titulo}</p>
                <p className="text-xs text-gray-400 mt-1">{descripcion}</p>
            </div>
            {children}
        </div>
    )
}
