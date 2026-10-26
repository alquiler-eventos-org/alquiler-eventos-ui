import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { mensajeDeError } from '../api/client'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)
    const { user, login } = useAuth()
    const navigate = useNavigate()

    // Si ya hay sesión vigente no tiene sentido mostrar el login.
    if (user) return <Navigate to="/dashboard" replace />

    async function handleSubmit(e) {
        e.preventDefault()
        if (!email.trim() || !password.trim()) {
            setError('Completá email y contraseña.')
            return
        }
        setError('')
        setCargando(true)
        try {
            await login(email.trim(), password)
            navigate('/dashboard')
        } catch (err) {
            setError(mensajeDeError(err, 'No se pudo iniciar sesión'))
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-sm"
            >
                <h1 className="text-xl font-semibold text-gray-900">Alquiler de Equipos</h1>
                <p className="text-sm text-gray-500 mt-1 mb-6">Iniciar sesión</p>

                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-4 bg-gray-50 text-sm outline-none focus:border-blue-500"
                    placeholder="tu@email.com"
                />

                <label className="block text-xs text-gray-500 mb-1">Contraseña</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-4 bg-gray-50 text-sm outline-none focus:border-blue-500"
                    placeholder="••••••••"
                />

                {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

                <button
                    type="submit"
                    disabled={cargando}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition"
                >
                    {cargando ? 'Ingresando…' : 'Ingresar'}
                </button>
            </form>
        </div>
    )
}