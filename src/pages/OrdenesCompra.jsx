import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { Badge, Modal, filtroCls } from '../components/UI'
import { formatoGs } from '../utils/formato'

// ====== DATOS DE MAQUETA (pantalla estática — luego se conecta a ms-compras /ordenes-compra) ======
// Estados con transiciones válidas: PENDIENTE -> CONFIRMADA -> RECIBIDA, PENDIENTE -> ANULADA
const ordenes = [
    { id: '#OC-201', proveedor: 'Distribuidora Fiesta PY', fecha: '2026-09-15', estado: 'PENDIENTE', total: 1250000 },
    { id: '#OC-202', proveedor: 'Eventos & Sonido SA', fecha: '2026-09-16', estado: 'CONFIRMADA', total: 3400000 },
    { id: '#OC-203', proveedor: 'Mobiliario Central', fecha: '2026-09-10', estado: 'RECIBIDA', total: 890000 },
    { id: '#OC-204', proveedor: 'Textiles del Este', fecha: '2026-09-08', estado: 'ANULADA', total: 560000 },
]

// Detalle estático (cabecera + líneas con equipos)
const detallesMock = {
    '#OC-201': [
        { equipo: 'Carpa 5x10 Grande', cantidad: 2, precio: 500000, subtotal: 1000000 },
        { equipo: 'Calefactor Eléctrico', cantidad: 5, precio: 50000, subtotal: 250000 },
    ],
    '#OC-202': [
        { equipo: 'Parlante JBL 15', cantidad: 4, precio: 750000, subtotal: 3000000 },
        { equipo: 'Micrófono inalámbrico', cantidad: 2, precio: 200000, subtotal: 400000 },
    ],
}

const filtros = ['Todas', 'PENDIENTE', 'CONFIRMADA', 'RECIBIDA', 'ANULADA']

export default function OrdenesCompra() {
    const [busqueda, setBusqueda] = useState('')
    const [filtro, setFiltro] = useState('Todas')
    const [detalle, setDetalle] = useState(null)

    const filtradas = ordenes.filter(
        (o) =>
            (filtro === 'Todas' || o.estado === filtro) &&
            `${o.id} ${o.proveedor}`.toLowerCase().includes(busqueda.toLowerCase()),
    )

    const lineas = detalle ? (detallesMock[detalle.id] ?? []) : []
    const totalDetalle = lineas.reduce((acc, l) => acc + l.subtotal, 0)

    return (
        <AppLayout titulo="Órdenes de Compra">
            <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-gray-400">{filtradas.length} órdenes</p>
                <div className="flex items-center gap-2">
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={filtroCls}
                        placeholder="Buscar orden o proveedor…"
                    />
                    <select
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        className={filtroCls}
                    >
                        {filtros.map((f) => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                        + Nueva orden
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                            <th className="px-4 py-3 font-medium">Orden</th>
                            <th className="px-4 py-3 font-medium">Proveedor</th>
                            <th className="px-4 py-3 font-medium">Fecha</th>
                            <th className="px-4 py-3 font-medium">Estado</th>
                            <th className="px-4 py-3 font-medium">Total</th>
                            <th className="px-4 py-3 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtradas.map((o) => (
                            <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-400">{o.id}</td>
                                <td className="px-4 py-3 text-gray-700">{o.proveedor}</td>
                                <td className="px-4 py-3 text-gray-700">{o.fecha}</td>
                                <td className="px-4 py-3">
                                    <Badge estado={o.estado} />
                                </td>
                                <td className="px-4 py-3 text-gray-700">{formatoGs(o.total)}</td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => setDetalle(o)}
                                        className="text-blue-600 hover:underline text-xs"
                                    >
                                        Ver
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtradas.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">
                        No hay órdenes que coincidan con el filtro.
                    </p>
                )}
            </div>

            {/* Modal de detalle — estático, sin conexión */}
            <Modal
                abierto={!!detalle}
                titulo={`Detalle de orden ${detalle?.id ?? ''}`}
                onCerrar={() => setDetalle(null)}
                ancho="max-w-2xl"
            >
                {detalle && (
                    <div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                            <div>
                                <p className="text-xs text-gray-400">Proveedor</p>
                                <p className="text-gray-900 font-medium">{detalle.proveedor}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Fecha</p>
                                <p className="text-gray-900 font-medium">{detalle.fecha}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Estado</p>
                                <Badge estado={detalle.estado} />
                            </div>
                        </div>

                        <table className="w-full text-sm mb-4">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                                    <th className="py-2 font-medium">Equipo</th>
                                    <th className="py-2 font-medium">Cant.</th>
                                    <th className="py-2 font-medium">Precio</th>
                                    <th className="py-2 font-medium text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lineas.map((l) => (
                                    <tr key={l.equipo} className="border-b border-gray-50">
                                        <td className="py-2 text-gray-700">{l.equipo}</td>
                                        <td className="py-2 text-gray-700">{l.cantidad}</td>
                                        <td className="py-2 text-gray-700">{formatoGs(l.precio)}</td>
                                        <td className="py-2 text-gray-700 text-right">{formatoGs(l.subtotal)}</td>
                                    </tr>
                                ))}
                                {lineas.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-4 text-center text-gray-400 text-xs">
                                            Sin líneas de detalle en la maqueta.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <div className="flex items-center justify-between text-sm font-semibold text-gray-900 mb-6">
                            <span>Total</span>
                            <span>{formatoGs(totalDetalle)}</span>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setDetalle(null)}
                                className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition"
                            >
                                Cerrar
                            </button>
                            <button className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition">
                                Imprimir
                            </button>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                                Cambiar estado
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AppLayout>
    )
}
