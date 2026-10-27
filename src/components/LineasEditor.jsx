import { inputCls } from './UI'
import { LINEA_VACIA } from '../utils/lineas'
import MontoInput from './MontoInput'

// Editor de líneas de una orden (equipo + cantidad [+ costo unitario]).
// Helpers en utils/lineas.js (LINEA_VACIA, lineasADetalles).
// `equipos` es la lista que devuelve GET /equipos; si no se pudo cargar (null),
// se pide el ID del equipo a mano para no bloquear el formulario.
export default function LineasEditor({ lineas, onChange, equipos, conCosto = false }) {
    function cambiar(indice, campo, valor) {
        onChange(lineas.map((l, i) => (i === indice ? { ...l, [campo]: valor } : l)))
    }

    function quitar(indice) {
        onChange(lineas.filter((_, i) => i !== indice))
    }

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Equipos</span>
                <button
                    type="button"
                    onClick={() => onChange([...lineas, { ...LINEA_VACIA }])}
                    className="text-xs text-blue-600 hover:underline"
                >
                    + Agregar equipo
                </button>
            </div>
            <div className="space-y-2">
                {lineas.map((l, i) => (
                    <div
                        key={i}
                        className={`grid items-center gap-2 ${
                            conCosto
                                ? 'grid-cols-[minmax(0,1fr)_5rem_8rem_auto]'
                                : 'grid-cols-[minmax(0,1fr)_5rem_auto]'
                        }`}
                    >
                        {equipos ? (
                            <select
                                value={l.equipoId}
                                onChange={(e) => cambiar(i, 'equipoId', e.target.value)}
                                className={`${inputCls} min-w-0`}
                            >
                                <option value="">Elegir equipo…</option>
                                {equipos.map((eq) => (
                                    <option key={eq.id} value={eq.id}>
                                        {eq.nombre} (stock {eq.stock})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="number"
                                min="1"
                                value={l.equipoId}
                                onChange={(e) => cambiar(i, 'equipoId', e.target.value)}
                                className={`${inputCls} min-w-0`}
                                placeholder="ID del equipo"
                            />
                        )}
                        <input
                            type="number"
                            min="1"
                            value={l.cantidad}
                            onChange={(e) => cambiar(i, 'cantidad', e.target.value)}
                            className={inputCls}
                            title="Cantidad"
                            placeholder="Cant."
                        />
                        {conCosto && (
                            <MontoInput
                                min="0"
                                value={l.costoUnitario}
                                onChange={(valor) => cambiar(i, 'costoUnitario', valor)}
                                title="Costo unitario"
                                placeholder="Costo unit."
                            />
                        )}
                        {lineas.length > 1 && (
                            <button
                                type="button"
                                onClick={() => quitar(i)}
                                className="text-red-500 hover:text-red-700 text-lg leading-none px-1"
                                aria-label="Quitar equipo"
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
