import { useCallback, useEffect, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { filtroCls } from '../components/UI'
import { listarClientes, eliminarCliente } from '../api/clientes'
import { mensajeDeError, normalizarPagina } from '../api/client'

// ====== Pantalla REAL: trae los clientes desde ms-alquiler via el API Gateway ======
// La paginacion es server-side: cada "Pagina" pide al backend la pagina siguiente.

const TAMANO_PAGINA = 6

export default function Clientes() {
    const [pagina, setPagina] = useState(0)
    const [busqueda, setBusqueda] = useState('')
    const [contenido, setContenido] = useState([])
    const [totalElementos, setTotalElementos] = useState(0)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')

    const cargar = useCallback(async (nroPagina) => {
        setCargando(true)
        setError('')
        try {
            let data
            if (busqueda.trim()) {
                const resp = await listarClientes({ busqueda: busqueda.trim(), page: nroPagina, size: TAMANO_PAGINA })
                data = normalizarPagina(resp.data, nroPagina, TAMANO_PAGINA)
            } else {
                const resp = await listarClientes({ page: nroPagina, size: TAMANO_PAGINA })
                data = normalizarPagina(resp.data, nroPagina, TAMANO_PAGINA)
            }
            setContenido(data.contenido)
            setTotalElementos(data.totalElementos)
        } catch (err) {
            setError(mensajeDeError(err))
            setContenido([])
            setTotalElementos(0)
        } finally {
            setCargando(false)
        }
    }, [busqueda])

    useEffect(() => {
        cargar(pagina)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagina])

    function handleSubmitBusqueda(e) {
        e.preventDefault()
        setPagina(0)
        cargar(0)
    }

    async function handleEliminar(id) {
        if (!window.confirm('¿Eliminar (borrado logico) este cliente?')) return
        try {
            await eliminarCliente(id)
            cargar(pagina)
        } catch (err) {
            setError(mensajeDeError(err))
        }
    }

    const totalPaginas = Math.max(1, Math.ceil(totalElementos / TAMANO_PAGINA))

    return (
        <AppLayout titulo="Clientes">
            <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-gray-400">
                    {cargando ? 'Cargando…' : `${totalElementos} clientes (datos reales via gateway)`}
                </p>
                <div className="flex items-center gap-2">
                    <form onSubmit={handleSubmitBusqueda} className="flex gap-2">
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className={filtroCls}
                            placeholder="Buscar por nombre, documento o email…"
                        />
                        <button
                            type="submit"
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium px-3 py-2 rounded-lg border border-gray-200 transition"
                        >
                            Buscar
                        </button>
                    </form>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                        + Nuevo cliente
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                    {error}
                </div>
            )}

            {cargando && !contenido.length && (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">
                    Cargando clientes desde el microservicio…
                </div>
            )}

            {!cargando && !error && (
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
                            {contenido.map((c) => (
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
                                        <button
                                            onClick={() => handleEliminar(c.id)}
                                            className="text-red-500 hover:underline text-xs"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!contenido.length && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                                        No hay clientes que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Paginacion server-side real */}
            <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-400">
                    Página {pagina + 1} de {totalPaginas}
                </p>
                <div className="flex gap-2">
                    <button
                        disabled={pagina === 0 || cargando}
                        onClick={() => setPagina((p) => Math.max(0, p - 1))}
                        className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        ← Anterior
                    </button>
                    <button
                        disabled={pagina + 1 >= totalPaginas || cargando}
                        onClick={() => setPagina((p) => p + 1)}
                        className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Siguiente →
                    </button>
                </div>
            </div>
        </AppLayout>
    )
}
