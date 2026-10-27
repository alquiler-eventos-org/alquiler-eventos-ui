import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Equipos from '../pages/Equipos'
import Clientes from '../pages/Clientes'
import OrdenesAlquiler from '../pages/OrdenesAlquiler'
import OrdenesCompra from '../pages/OrdenesCompra'
import Proveedores from '../pages/Proveedores'
import Usuarios from '../pages/Usuarios'
import Reportes from '../pages/Reportes'
import Configuracion from '../pages/Configuracion'
import { useAuth } from '../context/useAuth'
import { ROLES, tieneRol } from '../api/sesion'
import { ErrorServidor, NoEncontrada } from '../pages/Errores'

function SinPermisos() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <h1 className="text-base font-semibold text-gray-900">Sin permisos</h1>
            <p className="text-sm text-gray-500 mt-1">
                No posee permisos para este recurso.
            </p>
        </div>
    )
}

// Guardia de ruta: sin sesión => login; con sesión pero sin el rol => aviso.
// Cada página ya se dibuja dentro de su propio AppLayout, por eso acá solo se
// envuelve el aviso de "Sin permisos".
function protegida(elemento, roles) {
    return <Protegida roles={roles}>{elemento}</Protegida>
}

function Protegida({ roles, children }) {
    const { user } = useAuth()
    if (!user) return <Navigate to="/login" replace />
    if (!tieneRol(user, roles)) {
        return (
            <AppLayout>
                <SinPermisos />
            </AppLayout>
        )
    }
    return children
}

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={protegida(<Dashboard />)} />
            <Route path="/equipos" element={protegida(<Equipos />, ROLES.alquiler)} />
            <Route path="/clientes" element={protegida(<Clientes />, ROLES.alquiler)} />
            <Route
                path="/ordenes-alquiler"
                element={protegida(<OrdenesAlquiler />, ROLES.alquiler)}
            />
            <Route
                path="/ordenes-compra"
                element={protegida(<OrdenesCompra />, ROLES.compras)}
            />
            <Route path="/proveedores" element={protegida(<Proveedores />, ROLES.compras)} />
            <Route path="/usuarios" element={protegida(<Usuarios />, ROLES.seguridad)} />
            <Route path="/reportes" element={protegida(<Reportes />, ROLES.alquiler)} />
            <Route path="/configuracion" element={protegida(<Configuracion />)} />
            <Route path="/error" element={<ErrorServidor onReintentar={() => window.location.assign('/')} />} />
            <Route path="*" element={<NoEncontrada />} />
        </Routes>
    )
}
