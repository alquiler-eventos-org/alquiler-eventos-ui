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

// Por ahora todas las rutas son públicas (login simulado). Cuando conectemos
// los microservicios acá va la guardia de autenticación y permisos por rol.
function conLayout(elemento) {
    return <AppLayout>{elemento}</AppLayout>
}

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={conLayout(<Dashboard />)} />
            <Route path="/equipos" element={conLayout(<Equipos />)} />
            <Route path="/clientes" element={conLayout(<Clientes />)} />
            <Route path="/ordenes-alquiler" element={conLayout(<OrdenesAlquiler />)} />
            <Route path="/ordenes-compra" element={conLayout(<OrdenesCompra />)} />
            <Route path="/proveedores" element={conLayout(<Proveedores />)} />
            <Route path="/usuarios" element={conLayout(<Usuarios />)} />
            <Route path="/reportes" element={conLayout(<Reportes />)} />
            <Route path="/configuracion" element={conLayout(<Configuracion />)} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    )
}