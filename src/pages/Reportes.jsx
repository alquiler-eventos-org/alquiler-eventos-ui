import AppLayout from '../layouts/AppLayout'
import { BotonPrimario, BotonSecundario, Cargando, ErrorBanner } from '../components/UI'
import { formatoGs } from '../utils/formato'
import { descargarCsv } from '../utils/csv'
import { useConsulta } from '../hooks/useConsulta'
import {
    cargarResumen,
    equiposAfuera,
    equiposMasAlquilados,
    ingresosDelMes,
    ingresosPorMes,
    ordenesDelMes,
} from '../utils/resumen'

// ====== Reportes con datos reales ======
// No hay endpoints de reportes: se calculan en el navegador con las órdenes de
// alquiler que devuelve ms-alquiler (hasta 500). Las anuladas no cuentan.

export default function Reportes() {
    const { datos, cargando } = useConsulta(
        async () => ({ data: await cargarResumen({ alquiler: true, compras: false }) }),
        [],
    )
    const ordenes = datos?.ordenes ?? null

    const resumen = ordenes
        ? [
              { label: 'Ingresos del mes', valor: formatoGs(ingresosDelMes(ordenes)) },
              { label: 'Órdenes del mes', valor: ordenesDelMes(ordenes) },
              { label: 'Equipos afuera ahora', valor: equiposAfuera(ordenes) },
              { label: 'Equipos en mora', valor: equiposAfuera(ordenes, 'MORA') },
          ]
        : []
    const porMes = ordenes ? ingresosPorMes(ordenes) : []
    const top = ordenes ? equiposMasAlquilados(ordenes) : []
    const maxIngreso = Math.max(1, ...porMes.map((m) => m.valor))

    function exportar() {
        descargarCsv('reporte-alquiler.csv', [
            ['Ingresos por mes'],
            ['Mes', 'Ingreso'],
            ...porMes.map((m) => [m.mes, m.valor]),
            [],
            ['Equipos más alquilados'],
            ['Equipo', 'Líneas', 'Ingreso'],
            ...top.map((e) => [e.equipo, e.veces, e.ingreso]),
        ])
    }

    return (
        <AppLayout titulo="Reportes">
            {cargando && <Cargando />}
            {!cargando && !ordenes && (
                <ErrorBanner mensaje="No se pudieron cargar las órdenes de alquiler. ¿Está corriendo el backend?" />
            )}

            {ordenes && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {resumen.map((kpi) => (
                            <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
                                <p className="text-xs text-gray-500">{kpi.label}</p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">{kpi.valor}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h2 className="text-sm font-semibold text-gray-900 mb-4">
                                Ingresos por mes (últimos 6 meses)
                            </h2>
                            <div className="flex items-end gap-4 h-40">
                                {porMes.map((m) => (
                                    <div key={m.clave} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                                        <span className="text-[10px] text-gray-400">
                                            {(m.valor / 1000000).toFixed(1)}M
                                        </span>
                                        <div
                                            className="w-full bg-blue-500 rounded-t-md min-h-[2px]"
                                            style={{ height: `${(m.valor / maxIngreso) * 100}%` }}
                                            title={formatoGs(m.valor)}
                                        />
                                        <span className="text-xs text-gray-500">{m.mes}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h2 className="text-sm font-semibold text-gray-900 mb-4">
                                Equipos con más ingreso
                            </h2>
                            {top.length === 0 ? (
                                <p className="text-sm text-gray-400 py-4">Todavía no hay órdenes con equipos.</p>
                            ) : (
                                <ul className="divide-y divide-gray-50">
                                    {top.map((e) => (
                                        <li key={e.equipo} className="flex items-center justify-between py-2.5 text-sm">
                                            <span className="text-gray-700">{e.equipo}</span>
                                            <span className="flex items-center gap-3">
                                                <span className="text-xs text-gray-400">{e.veces} {e.veces === 1 ? 'alquiler' : 'alquileres'}</span>
                                                <span className="text-gray-900 font-medium">{formatoGs(e.ingreso)}</span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">
                            Calculado con {ordenes.length} órdenes de alquiler (sin contar las anuladas).
                        </p>
                        <div className="flex gap-2">
                            <BotonSecundario onClick={exportar}>Exportar CSV</BotonSecundario>
                            <BotonPrimario onClick={() => window.print()}>Imprimir / guardar PDF</BotonPrimario>
                        </div>
                    </div>
                </>
            )}
        </AppLayout>
    )
}
