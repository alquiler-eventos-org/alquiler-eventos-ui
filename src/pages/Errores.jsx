import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

// Páginas de error amigables (nunca una pantalla en blanco).

function Pantalla({ codigo, titulo, texto, children }) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200 rounded-xl p-10 max-w-md text-center">
                <p className="text-5xl font-semibold text-[#1f2333] mb-2">{codigo}</p>
                <h1 className="text-base font-semibold text-gray-900">{titulo}</h1>
                <p className="text-sm text-gray-500 mt-2 mb-6">{texto}</p>
                {children}
            </div>
        </div>
    )
}

const btn = 'inline-block bg-[#1f2333] text-white text-sm px-4 py-2 rounded-lg hover:opacity-90'

export function NoEncontrada() {
    const { user } = useAuth()
    return (
        <Pantalla
            codigo="404"
            titulo="Página no encontrada"
            texto="La dirección que buscás no existe o fue movida."
        >
            <Link to={user ? '/dashboard' : '/login'} className={btn}>
                {user ? 'Volver al inicio' : 'Ir a iniciar sesión'}
            </Link>
        </Pantalla>
    )
}

export function ErrorServidor({ onReintentar }) {
    return (
        <Pantalla
            codigo="500"
            titulo="Algo salió mal"
            texto="Ocurrió un error inesperado. Probá de nuevo; si sigue pasando, avisá al administrador."
        >
            <button onClick={onReintentar} className={`${btn} mr-2`}>
                Reintentar
            </button>
            <a href="/" className="text-sm text-gray-500 hover:underline">
                Ir al inicio
            </a>
        </Pantalla>
    )
}
