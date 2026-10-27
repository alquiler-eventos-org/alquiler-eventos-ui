import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../context/useAuth'

// ====== Configuraciones — según Figma "08 - Configuraciones" ======
// Los parámetros se guardan en ESTE navegador (localStorage): el backend no
// tiene todavía un endpoint de configuración. La tarjeta de sesión sí muestra
// datos reales leídos del JWT del usuario.

const CLAVE = 'configuracion-sistema'

function leerConfig() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE)) ?? {}
    } catch {
        return {}
    }
}

// Fila de configuración: título + descripción a la izquierda, control a la derecha.
// En desktop la columna del control empieza en una posición fija, como en el Figma.
function Fila({ titulo, descripcion, children }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-6 grid gap-4 sm:grid-cols-[19rem_1fr] sm:items-center">
            <div>
                <p className="text-sm font-semibold text-gray-900">{titulo}</p>
                <p className="text-xs text-gray-400 mt-1">{descripcion}</p>
            </div>
            {children}
        </div>
    )
}

// Campo gris relleno (sin borde), como en el Figma
const inputCfgCls =
    'w-full sm:w-44 bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/30'

export default function Configuracion() {
    const { user } = useAuth()
    const [inicial] = useState(leerConfig)
    const [dias, setDias] = useState(inicial.dias ?? '')
    const [tarifa, setTarifa] = useState(inicial.tarifa ?? '')
    const [categorias, setCategorias] = useState(inicial.categorias ?? '')
    const [plantilla, setPlantilla] = useState(inicial.plantilla ?? '')
    const [guardado, setGuardado] = useState(false)

    function guardar() {
        try {
            localStorage.setItem(CLAVE, JSON.stringify({ dias, tarifa, categorias, plantilla }))
            setGuardado(true)
        } catch {
            setGuardado(false)
        }
    }

    return (
        <AppLayout>
            {/* Encabezado blanco a ancho completo, como en el Figma */}
            <div className="-mx-6 -mt-6 mb-6 bg-white border-b border-gray-100 px-8 py-6">
                <h1 className="text-lg font-semibold text-gray-900">Configuraciones</h1>
            </div>

            <div className="max-w-3xl space-y-5">
                <Fila
                    titulo="Sesión actual"
                    descripcion="Datos tomados del token JWT emitido por ms-seguridad"
                >
                    <div className="text-sm text-gray-700 space-y-1">
                        <p>{user?.email}</p>
                        <p className="text-xs text-gray-500">Roles: {user?.roles?.join(', ')}</p>
                        <p className="text-xs text-gray-500">
                            El token vence: {user?.exp ? new Date(user.exp * 1000).toLocaleTimeString('es-PY') : '—'}
                        </p>
                    </div>
                </Fila>

                <Fila
                    titulo="Días de anticipación para recordatorio"
                    descripcion="Ej: 2 días antes de la devolución"
                >
                    <input
                        value={dias}
                        onChange={(e) => setDias(e.target.value)}
                        className={inputCfgCls}
                        placeholder="2"
                    />
                </Fila>

                <Fila titulo="Tarifa de mora por día" descripcion="Monto aplicado por cada día de atraso">
                    <input
                        value={tarifa}
                        onChange={(e) => setTarifa(e.target.value)}
                        className={inputCfgCls}
                        placeholder="₲ 5.000"
                    />
                </Fila>

                <Fila titulo="Categorías de equipos" descripcion="Sonido, Mesas, Sillas, Carpas...">
                    <input
                        value={categorias}
                        onChange={(e) => setCategorias(e.target.value)}
                        className={inputCfgCls}
                        placeholder="Sonido, Mesas, Sillas, Carpas…"
                    />
                </Fila>

                <Fila
                    titulo="Plantilla de mail"
                    descripcion="Texto usado en confirmaciones y recordatorios"
                >
                    <input
                        value={plantilla}
                        onChange={(e) => setPlantilla(e.target.value)}
                        className={inputCfgCls}
                        placeholder="Hola {cliente}, tu devolución es el {fecha}…"
                    />
                </Fila>

                <Fila
                    titulo="Logotipo del sistema"
                    descripcion="Se muestra en el login y en el menú lateral"
                >
                    <div className="flex items-center gap-3 sm:justify-self-end">
                        <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-[10px] text-gray-400">
                            Logo
                        </div>
                        <button className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg transition">
                            ↑ Cambiar logo
                        </button>
                    </div>
                </Fila>

                <div className="flex items-center gap-3">
                    <button
                        onClick={guardar}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
                    >
                        Guardar cambios
                    </button>
                    {guardado && (
                        <span className="text-xs text-green-600">Guardado en este navegador.</span>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
