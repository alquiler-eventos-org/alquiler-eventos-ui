import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { Badge, Modal, filtroCls } from '../components/UI'
import { formatoGs } from '../utils/formato'

// ====== DATOS DE MAQUETA (pantalla estática — luego se conecta a ms-inventario) ======
const equipos = [
    { id: 1, nombre: 'Carpa 5x10 Grande', tipo: 'Carpa', stockTotal: 5, stockDisponible: 3, precio: 350000, estado: 'DISPONIBLE' },
    { id: 2, nombre: 'Carpa 3x3 Blanca', tipo: 'Carpa', stockTotal: 8, stockDisponible: 8, precio: 250000, estado: 'DISPONIBLE' },
    { id: 3, nombre: 'Sillas Tiffany Doradas', tipo: 'Silla', stockTotal: 200, stockDisponible: 45, precio: 8000, estado: 'DISPONIBLE' },
    { id: 4, nombre: 'Mesa Vestida Redonda', tipo: 'Mesa', stockTotal: 40, stockDisponible: 0, prestadas: 40, precio: 35000, estado: 'PRESTADO' },
    { id: 5, nombre: 'Vajilla Completa 100 pax', tipo: 'Vajilla', stockTotal: 12, stockDisponible: 4, precio: 120000, estado: 'DISPONIBLE' },
    { id: 6, nombre: 'Parlante JBL 15', tipo: 'Audio', stockTotal: 6, stockDisponible: 1, precio: 150000, estado: 'DISPONIBLE' },
    { id: 7, nombre: 'Living Modular Blanco', tipo: 'Living', stockTotal: 3, stockDisponible: 0, prestadas: 3, precio: 400000, estado: 'PRESTADO' },
    { id: 8, nombre: 'Calefactor Eléctrico', tipo: 'Clima', stockTotal: 10, stockDisponible: 2, precio: 60000, estado: 'BAJO_STOCK' },
]

const tipos = ['Todos', 'Carpa', 'Silla', 'Mesa', 'Vajilla', 'Audio', 'Living', 'Clima']

export default function Equipos() {
    const [busqueda, setBusqueda] = useState('')
    const [tipoFiltro, setTipoFiltro] = useState('Todos')
    const [detalle, setDetalle] = useState(null)

    // Filtros solo en memoria (estático)
    const filtrados = equipos.filter(
        (e) =>
            e.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
            (tipoFiltro === 'Todos' || e.tipo === tipoFiltro),
    )

    return (
        <AppLayout titulo="Equipos">
            <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-gray-400">{filtrados.length} equipos</p>
                <div className="flex items-center gap-2">
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={filtroCls}
                        placeholder="Buscar equipo…"
                    />
                    <select
                        value={tipoFiltro}
                        onChange={(e) => setTipoFiltro(e.target.value)}
                        className={filtroCls}
                    >
                        {tipos.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                        + Nuevo equipo
                    </button>
                    <button className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition">
                        Exportar CSV
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                            <th className="px-4 py-3 font-medium">Código</th>
                            <th className="px-4 py-3 font-medium">Nombre</th>
                            <th className="px-4 py-3 font-medium">Tipo</th>
                            <th className="px-4 py-3 font-medium">Stock</th>
                            <th className="px-4 py-3 font-medium">Precio/día</th>
                            <th className="px-4 py-3 font-medium">Estado</th>
                            <th className="px-4 py-3 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.map((eq) => (
                            <tr key={eq.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-400">EQ-00{eq.id}</td>
                                <td className="px-4 py-3 text-gray-700">{eq.nombre}</td>
                                <td className="px-4 py-3 text-gray-700">{eq.tipo}</td>
                                <td className="px-4 py-3 text-gray-700">
                                    {eq.stockDisponible} / {eq.stockTotal}
                                </td>
                                <td className="px-4 py-3 text-gray-700">{formatoGs(eq.precio)}</td>
                                <td className="px-4 py-3">
                                    <Badge estado={eq.estado} />
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => setDetalle(eq)}
                                        className="text-blue-600 hover:underline text-xs"
                                    >
                                        Ver
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtrados.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">
                        No hay equipos que coincidan con el filtro.
                    </p>
                )}
            </div>

            {/* Modal de detalle — estático, sin conexión */}
            <Modal abierto={!!detalle} titulo={`Equipo ${detalle ? `EQ-00${detalle.id}` : ''}`} onCerrar={() => setDetalle(null)}>
                {detalle && (
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">{detalle.nombre}</h3>
                        <p className="text-xs text-gray-400 mb-4">{detalle.tipo}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                            <div>
                                <p className="text-xs text-gray-400">Stock disponible</p>
                                <p className="text-gray-900 font-medium">{detalle.stockDisponible} / {detalle.stockTotal}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Prestados ahora</p>
                                <p className="text-gray-900 font-medium">{detalle.prestadas ?? detalle.stockTotal - detalle.stockDisponible}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Precio por día</p>
                                <p className="text-gray-900 font-medium">{formatoGs(detalle.precio)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Estado</p>
                                <Badge estado={detalle.estado} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setDetalle(null)}
                                className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition"
                            >
                                Cerrar
                            </button>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                                Editar equipo
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AppLayout>
    )
}
