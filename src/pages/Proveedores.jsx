import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { filtroCls } from '../components/UI'

// ====== DATOS DE MAQUETA (pantalla estática — luego se conecta a ms-compras /proveedores) ======
const proveedores = [
    { id: 1, nombre: 'Distribuidora Fiesta PY', contacto: 'Ramón Ortiz', telefono: '0981 400 200', email: 'ventas@fiestapy.com', activo: true },
    { id: 2, nombre: 'Eventos & Sonido SA', contacto: 'Carina Méndez', telefono: '0972 311 554', email: 'carina@eventossonido.com', activo: true },
    { id: 3, nombre: 'Mobiliario Central', contacto: 'Pedro Aguirre', telefono: '0983 810 090', email: 'pedro@mobiliariocentral.com', activo: true },
    { id: 4, nombre: 'Textiles del Este', contacto: 'Sofía Rojas', telefono: '0961 777 123', email: 'sofia@textileseste.com', activo: false },
]

export default function Proveedores() {
    const [busqueda, setBusqueda] = useState('')

    // Filtro solo en memoria (estático)
    const filtrados = proveedores.filter((p) =>
        `${p.nombre} ${p.contacto} ${p.email}`.toLowerCase().includes(busqueda.toLowerCase()),
    )

    return (
        <AppLayout titulo="Proveedores">
            <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-gray-400">{filtrados.length} proveedores</p>
                <div className="flex items-center gap-2">
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={filtroCls}
                        placeholder="Buscar proveedor…"
                    />
                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                        + Nuevo proveedor
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                            <th className="px-4 py-3 font-medium">Nombre</th>
                            <th className="px-4 py-3 font-medium">Contacto</th>
                            <th className="px-4 py-3 font-medium">Teléfono</th>
                            <th className="px-4 py-3 font-medium">Email</th>
                            <th className="px-4 py-3 font-medium">Estado</th>
                            <th className="px-4 py-3 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.map((p) => (
                            <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-700">{p.nombre}</td>
                                <td className="px-4 py-3 text-gray-700">{p.contacto}</td>
                                <td className="px-4 py-3 text-gray-700">{p.telefono}</td>
                                <td className="px-4 py-3 text-gray-700">{p.email}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            p.activo
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}
                                    >
                                        {p.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right space-x-3">
                                    <button className="text-blue-600 hover:underline text-xs">Editar</button>
                                    <button className="text-red-500 hover:underline text-xs">Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtrados.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">
                        No hay proveedores que coincidan con la búsqueda.
                    </p>
                )}
            </div>
        </AppLayout>
    )
}
