import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { filtroCls } from '../components/UI'

// ====== DATOS DE MAQUETA (pantalla estática — luego se conecta a ms-alquiler /clientes) ======
const clientes = [
    { id: 1, nombre: 'María', apellido: 'González', documento: '4.101.552', telefono: '0981 123 456', email: 'maria.gonzalez@gmail.com', activo: true },
    { id: 2, nombre: 'Carlos', apellido: 'Ramírez', documento: '3.882.410', telefono: '0972 445 778', email: 'c.ramirez@hotmail.com', activo: true },
    { id: 3, nombre: 'Lucía', apellido: 'Fernández', documento: '5.233.901', telefono: '0983 220 118', email: 'luciaf@gmail.com', activo: true },
    { id: 4, nombre: 'Jorge', apellido: 'Benítez', documento: '2.940.117', telefono: '0961 789 330', email: 'jbenitez@outlook.com', activo: false },
    { id: 5, nombre: 'Ana', apellido: 'Villalba', documento: '4.577.260', telefono: '0985 660 442', email: 'ana.villalba@gmail.com', activo: true },
    { id: 6, nombre: 'Empresa "Fiesta Total SA"', apellido: '-', documento: '80012.345-6', telefono: '021 555 120', email: 'contacto@fiestatotal.com.py', activo: true },
]

export default function Clientes() {
    const [busqueda, setBusqueda] = useState('')

    // Filtro solo en memoria (estático)
    const filtrados = clientes.filter((c) =>
        `${c.nombre} ${c.apellido} ${c.documento} ${c.email}`
            .toLowerCase()
            .includes(busqueda.toLowerCase()),
    )

    return (
        <AppLayout titulo="Clientes">
            <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-gray-400">{filtrados.length} clientes</p>
                <div className="flex items-center gap-2">
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={filtroCls}
                        placeholder="Buscar por nombre, documento o email…"
                    />
                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                        + Nuevo cliente
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                            <th className="px-4 py-3 font-medium">Nombre</th>
                            <th className="px-4 py-3 font-medium">Documento</th>
                            <th className="px-4 py-3 font-medium">Teléfono</th>
                            <th className="px-4 py-3 font-medium">Email</th>
                            <th className="px-4 py-3 font-medium">Estado</th>
                            <th className="px-4 py-3 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.map((c) => (
                            <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-700">
                                    {c.nombre} {c.apellido}
                                </td>
                                <td className="px-4 py-3 text-gray-700">{c.documento}</td>
                                <td className="px-4 py-3 text-gray-700">{c.telefono}</td>
                                <td className="px-4 py-3 text-gray-700">{c.email}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            c.activo
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}
                                    >
                                        {c.activo ? 'Activo' : 'Inactivo'}
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
                        No hay clientes que coincidan con la búsqueda.
                    </p>
                )}
            </div>
        </AppLayout>
    )
}
