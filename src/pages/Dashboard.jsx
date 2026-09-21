import AppLayout from '../layouts/AppLayout'

const kpis = [
    { label: 'Órdenes activas', valor: '12' },
    { label: 'Vencidas / Mora', valor: '2' },
    { label: 'Stock bajo', valor: '5' },
    { label: 'Ingresos del mes', valor: '₲ 4.500.000' },
]

const ordenes = [
    { id: '#1001', cliente: 'Cliente 1', estado: 'Reservado', total: '₲ 350.000' },
    { id: '#1002', cliente: 'Cliente 2', estado: 'Entregado', total: '₲ 520.000' },
    { id: '#1003', cliente: 'Cliente 3', estado: 'Devuelto', total: '₲ 180.000' },
    { id: '#1004', cliente: 'Cliente 4', estado: 'Vencido', total: '₲ 275.000' },
]

const estadoColor = {
    Reservado: 'bg-gray-100 text-gray-600',
    Entregado: 'bg-blue-100 text-blue-600',
    Devuelto: 'bg-green-100 text-green-600',
    Vencido: 'bg-red-100 text-red-600',
}

export default function Dashboard() {
    return (
        <AppLayout titulo="Dashboard">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {kpis.map((kpi) => (
                    <div
                        key={kpi.label}
                        className="bg-white rounded-xl border border-gray-200 p-4"
                    >
                        <p className="text-xs text-gray-500">{kpi.label}</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">{kpi.valor}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Órdenes recientes</h2>
                <table className="w-full text-sm">
                    <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                        <th className="py-2 font-medium">Orden</th>
                        <th className="py-2 font-medium">Cliente</th>
                        <th className="py-2 font-medium">Estado</th>
                        <th className="py-2 font-medium">Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    {ordenes.map((orden) => (
                        <tr key={orden.id} className="border-b border-gray-50 last:border-0">
                            <td className="py-3 text-gray-700">{orden.id}</td>
                            <td className="py-3 text-gray-700">{orden.cliente}</td>
                            <td className="py-3">
                  <span
                      className={`text-xs px-2 py-1 rounded-full ${estadoColor[orden.estado]}`}
                  >
                    {orden.estado}
                  </span>
                            </td>
                            <td className="py-3 text-gray-700">{orden.total}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    )
}