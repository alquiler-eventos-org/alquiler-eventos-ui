import AppLayout from '../layouts/AppLayout'
import { formatoGs } from '../utils/formato'

// ====== DATOS DE MAQUETA (pantalla estática — luego se conecta a reportes) ======
const resumen = [
    { label: 'Ingresos del mes', valor: '₲ 4.500.000' },
    { label: 'Órdenes del mes', valor: '12' },
    { label: 'Equipos alquilados', valor: '34' },
    { label: 'Equipos en mora', valor: '2' },
]

const masAlquilados = [
    { equipo: 'Carpa 5x10 Grande', veces: 18, ingreso: 6300000 },
    { equipo: 'Sillas Tiffany Doradas', veces: 15, ingreso: 960000 },
    { equipo: 'Mesa Vestida Redonda', veces: 12, ingreso: 420000 },
    { equipo: 'Parlante JBL 15', veces: 9, ingreso: 1350000 },
    { equipo: 'Living Modular Blanco', veces: 6, ingreso: 2400000 },
]

const ingresosPorMes = [
    { mes: 'Abril', valor: 2800000 },
    { mes: 'Mayo', valor: 3400000 },
    { mes: 'Junio', valor: 3100000 },
    { mes: 'Julio', valor: 3900000 },
    { mes: 'Agosto', valor: 4100000 },
    { mes: 'Septiembre', valor: 4500000 },
]

const maxIngreso = Math.max(...ingresosPorMes.map((m) => m.valor))

export default function Reportes() {
    return (
        <AppLayout titulo="Reportes">
            {/* Resumen del mes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {resumen.map((kpi) => (
                    <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-xs text-gray-500">{kpi.label}</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">{kpi.valor}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Gráfico de barras simple (CSS, sin librería) */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">
                        Ingresos por mes (últimos 6 meses)
                    </h2>
                    <div className="flex items-end gap-4 h-40">
                        {ingresosPorMes.map((m) => (
                            <div key={m.mes} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] text-gray-400">
                                    {(m.valor / 1000000).toFixed(1)}M
                                </span>
                                <div
                                    className="w-full bg-blue-500 rounded-t-md"
                                    style={{ height: `${(m.valor / maxIngreso) * 100}%` }}
                                    title={formatoGs(m.valor)}
                                />
                                <span className="text-xs text-gray-500">{m.mes}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Equipos más alquilados */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">Equipos más alquilados</h2>
                    <ul className="divide-y divide-gray-50">
                        {masAlquilados.map((e) => (
                            <li key={e.equipo} className="flex items-center justify-between py-2.5 text-sm">
                                <span className="text-gray-700">{e.equipo}</span>
                                <span className="flex items-center gap-3">
                                    <span className="text-xs text-gray-400">{e.veces} alquileres</span>
                                    <span className="text-gray-900 font-medium">{formatoGs(e.ingreso)}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">
                    Reporte completo de septiembre 2026 listo para descargar.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                    Descargar PDF
                </button>
            </div>
        </AppLayout>
    )
}
