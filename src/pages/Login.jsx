import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const { login } = useAuth()
    const navigate = useNavigate()

    function handleSubmit(e) {
        e.preventDefault()
        if (!email.trim() || !password.trim()) {
            setError('Completá email y contraseña.')
            return
        }
        setError('')
        login(email)
        navigate('/dashboard')
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
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition"
                >
                    Ingresar
                </button>
            </form>
        </div>
    )
}