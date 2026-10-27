import AppLayout from '../layouts/AppLayout'
import { Badge, Cargando } from '../components/UI'
import { formatoFecha, formatoGs } from '../utils/formato'
import { useConsulta } from '../hooks/useConsulta'
import { useAuth } from '../context/useAuth'
import { ROLES, tieneRol } from '../api/sesion'
import {
    STOCK_BAJO,
    cargarResumen,
    contarEstado,
    ingresosDelMes,
} from '../utils/resumen'

// ====== Dashboard con datos reales ======
// Los indicadores se calculan con las órdenes y equipos de ms-alquiler y las
// órdenes de compra de ms-compras, según lo que el rol del usuario puede ver.

export default function Dashboard() {
    const { user } = useAuth()
    const alquiler = tieneRol(user, ROLES.alquiler)
    const compras = tieneRol(user, ROLES.compras)

    const { datos, cargando } = useConsulta(
        async () => ({ data: await cargarResumen({ alquiler, compras }) }),
        [alquiler, compras],
    )

    const ordenes = datos?.ordenes
    const equipos = datos?.equipos
    const kpis = [
        {
            label: 'Órdenes activas',
            valor: ordenes ? contarEstado(ordenes, 'RESERVA', 'ENTREGA') : null,
        },
        { label: 'En mora', valor: ordenes ? contarEstado(ordenes, 'MORA') : null },
        {
            label: 'Stock bajo',
            valor: equipos ? equipos.filter((e) => e.stock <= STOCK_BAJO).length : null,
        },
        {
            label: 'Ingresos del mes',
            valor: ordenes ? formatoGs(ingresosDelMes(ordenes)) : null,
        },
        { label: 'Compras pendientes', valor: datos?.comprasPendientes ?? null },
    ]

    const recientes = ordenes ? [...ordenes].sort((a, b) => b.id - a.id).slice(0, 5) : []

    return (
        <AppLayout titulo="Dashboard">
            <p className="text-sm text-gray-500 mb-4">
                Hola, <span className="font-medium text-gray-900">{user?.email}</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-xs text-gray-500">{kpi.label}</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                            {cargando ? '…' : (kpi.valor ?? '—')}
                        </p>
                    </div>
                ))}
            </div>

            {alquiler && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h2 className="text-sm font-semibold text-gray-900 mb-3">Órdenes recientes</h2>
                    {cargando ? (
                        <Cargando />
                    ) : recientes.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">
                            No se pudieron cargar las órdenes.
                        </p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                                                                        <th className="py-2 font-medium">Cliente</th>
                                    <th className="py-2 font-medium">Evento</th>
                                    <th className="py-2 font-medium">Estado</th>
                                    <th className="py-2 font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recientes.map((o) => (
                                    <tr key={o.id} className="border-b border-gray-50 last:border-0">
                                                                                <td className="py-3 text-gray-700">{o.clienteNombre}</td>
                                        <td className="py-3 text-gray-700">{formatoFecha(o.fechaEvento)}</td>
                                        <td className="py-3">
                                            <Badge estado={o.estado} />
                                        </td>
                                        <td className="py-3 text-gray-700">{formatoGs(o.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
            {!alquiler && (
                <p className="text-sm text-gray-400">
                    Tu rol no incluye el módulo de alquiler; usá el menú para entrar a tus pantallas.
                </p>
            )}
        </AppLayout>
    )
}
