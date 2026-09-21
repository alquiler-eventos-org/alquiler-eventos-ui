import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const menuItems = [
    'Dashboard',
    'Equipos',
    'Clientes',
    'Órdenes de Alquiler',
    'Órdenes de Compra',
    'Proveedores',
    'Usuarios',
    'Reportes',
    'Configuración',
]

export default function AppLayout({ children, titulo }) {
    const { logout } = useAuth()
    const navigate = useNavigate()

    function handleLogout() {
        logout()
        navigate('/login')
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <aside className="w-56 bg-[#1f2333] text-white flex flex-col">
                <div className="px-6 py-5 font-semibold text-sm">Alquiler Eventos</div>
                <nav className="flex-1 px-3">
                    {menuItems.map((item, i) => (
                        <div
                            key={item}
                            className={`px-3 py-2 rounded-lg text-sm mb-1 cursor-pointer ${
                                i === 0
                                    ? 'bg-white/10 text-white font-medium'
                                    : 'text-gray-300 hover:bg-white/5'
                            }`}
                        >
                            {item}
                        </div>
                    ))}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                    <h1 className="text-base font-semibold text-gray-900">{titulo}</h1>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-500 hover:text-gray-800"
                    >
                        Admin ▾ (Cerrar sesión)
                    </button>
                </header>

                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    )
}