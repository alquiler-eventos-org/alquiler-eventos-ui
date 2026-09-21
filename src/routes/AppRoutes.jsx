import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'

function RutaProtegida({ children }) {
    const { user } = useAuth()
    if (!user) {
        return <Navigate to="/login" replace />
    }
    return children
}

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route
                path="/dashboard"
                element={
                    <RutaProtegida>
                        <Dashboard />
                    </RutaProtegida>
                }
            />
        </Routes>
    )
}