import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

// Menú lateral. Cada ítem apunta a su ruta real en AppRoutes.
const menuItems = [
    { nombre: 'Dashboard', ruta: '/dashboard' },
    { nombre: 'Equipos', ruta: '/equipos' },
    { nombre: 'Clientes', ruta: '/clientes' },
    { nombre: 'Órdenes de Alquiler', ruta: '/ordenes-alquiler' },
    { nombre: 'Órdenes de Compra', ruta: '/ordenes-compra' },
    { nombre: 'Proveedores', ruta: '/proveedores' },
    { nombre: 'Usuarios', ruta: '/usuarios' },
    { nombre: 'Reportes', ruta: '/reportes' },
    { nombre: 'Configuración', ruta: '/configuracion' },
]

// Encabezado interno de cada página: título a la izquierda, acciones a la derecha.
export function EncabezadoPagina({ titulo, children }) {
    return (
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-base font-semibold text-gray-900">{titulo}</h1>
            <div className="flex items-center gap-2">{children}</div>
        </div>
    )
}

export default function AppLayout({ children }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    function handleLogout() {
        logout()
        navigate('/login')
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <aside className="w-56 bg-[#1f2333] text-white flex flex-col fixed inset-y-0 left-0">
                <div className="px-6 py-5 font-semibold text-sm">Alquiler Eventos</div>
                <nav className="flex-1 px-3 overflow-y-auto">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.ruta}
                            to={item.ruta}
                            className={({ isActive }) =>
                                `block px-3 py-2 rounded-lg text-sm mb-1 ${
                                    isActive
                                        ? 'bg-white/10 text-white font-medium'
                                        : 'text-gray-300 hover:bg-white/5'
                                }`
                            }
                        >
                            {item.nombre}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col ml-56">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                    <span className="text-sm text-gray-400">Sistema de Alquiler de Equipos</span>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-500 hover:text-gray-800"
                    >
                        {user?.nombre ?? 'Usuario'} ▾ (Cerrar sesión)
                    </button>
                </header>

                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    )
}