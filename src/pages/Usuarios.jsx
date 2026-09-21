import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { filtroCls } from '../components/UI'

// ====== DATOS DE MAQUETA (pantalla estática — luego se conecta a ms-seguridad/usuarios) ======
const usuarios = [
    { id: 1, nombre: 'Admin General', email: 'admin@eventos.com', rol: 'ADMIN', activo: true },
    { id: 2, nombre: 'Rosa Cáceres', email: 'rosa@eventos.com', rol: 'OPERADOR', activo: true },
    { id: 3, nombre: 'Miguel Ayala', email: 'miguel@eventos.com', rol: 'OPERADOR', activo: true },
    { id: 4, nombre: 'Claudia Duarte', email: 'claudia@eventos.com', rol: 'CONSULTA', activo: false },
]

const roles = {
    ADMIN: 'bg-purple-100 text-purple-600',
    OPERADOR: 'bg-blue-100 text-blue-600',
    CONSULTA: 'bg-gray-100 text-gray-600',
}

export default function Usuarios() {
    const [busqueda, setBusqueda] = useState('')

    const filtrados = usuarios.filter((u) =>
        `${u.nombre} ${u.email} ${u.rol}`.toLowerCase().includes(busqueda.toLowerCase()),
    )

    return (
        <AppLayout titulo="Usuarios">
            <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-gray-400">{filtrados.length} usuarios</p>
                <div className="flex items-center gap-2">
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={filtroCls}
                        placeholder="Buscar usuario…"
                    />
                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                        + Nuevo usuario
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                            <th className="px-4 py-3 font-medium">Nombre</th>
                            <th className="px-4 py-3 font-medium">Email</th>
                            <th className="px-4 py-3 font-medium">Rol</th>
                            <th className="px-4 py-3 font-medium">Estado</th>
                            <th className="px-4 py-3 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.map((u) => (
                            <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-700">{u.nombre}</td>
                                <td className="px-4 py-3 text-gray-700">{u.email}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full font-medium ${roles[u.rol]}`}
                                    >
                                        {u.rol}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            u.activo
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}
                                    >
                                        {u.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right space-x-3">
                                    <button className="text-blue-600 hover:underline text-xs">Editar</button>
                                    <button className="text-red-500 hover:underline text-xs">Desactivar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtrados.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">
                        No hay usuarios que coincidan con la búsqueda.
                    </p>
                )}
            </div>
        </AppLayout>
    )
}
