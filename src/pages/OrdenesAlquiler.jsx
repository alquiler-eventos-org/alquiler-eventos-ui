import { useEffect, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { Badge, Modal, Paginacion, filtroCls } from '../components/UI'
import { formatoGs } from '../utils/formato'
import { mensajeDeError, normalizarPagina } from '../api/client'
import {
    TRANSICIONES,
    cambiarEstadoOrdenAlquiler,
    listarOrdenesAlquiler,
} from '../api/ordenesAlquiler'

// ====== Pantalla REAL: órdenes de alquiler desde ms-alquiler via el API Gateway ======
// Paginación y filtro por estado se hacen en el servidor.

const TAMANO_PAGINA = 6
const filtros = ['Todas', 'RESERVA', 'ENTREGA', 'DEVOLUCION', 'MORA', 'ANULADA']

const textoAccion = {
    ENTREGA: 'Entregar (descuenta stock)',
    DEVOLUCION: 'Registrar devolución',
    MORA: 'Marcar en mora',
    ANULADA: 'Anular',
}

export default function OrdenesAlquiler() {
    const [pagina, setPagina] = useState(0)
    const [filtro, setFiltro] = useState('Todas')
    const [recarga, setRecarga] = useState(0)
    const [datos, setDatos] = useState({ clave: null, contenido: [], total: 0, error: '' })
    const [detalle, setDetalle] = useState(null)
    const [errorAccion, setErrorAccion] = useState('')
    const [guardando, setGuardando] = useState(false)

    // La "clave" identifica la consulta actual; mientras los datos guardados no
    // correspondan a ella, la pantalla está cargando.
    const clave = `${pagina}|${filtro}|${recarga}`
    const cargando = datos.clave !== clave

    useEffect(() => {
        let activo = true
        const estado = filtro === 'Todas' ? undefined : filtro
        listarOrdenesAlquiler({ page: pagina, size: TAMANO_PAGINA, estado })
            .then((resp) => {
                const p = normalizarPagina(resp.data, pagina, TAMANO_PAGINA)
                if (activo) setDatos({ clave, contenido: p.contenido, total: p.totalElementos, error: '' })
            })
            .catch((err) => {
                if (activo) setDatos({ clave, contenido: [], total: 0, error: mensajeDeError(err) })
            })
        return () => {
            activo = false
        }
    }, [clave, pagina, filtro])

    function cambiarFiltro(nuevo) {
        setFiltro(nuevo)
        setPagina(0)
    }

    function abrirDetalle(orden) {
        setErrorAccion('')
        setDetalle(orden)
    }

    async function cambiarEstado(orden, nuevoEstado) {
        if (!window.confirm(`¿Pasar la orden #${orden.id} a ${nuevoEstado}?`)) return
        setGuardando(true)
        setErrorAccion('')
        try {
            await cambiarEstadoOrdenAlquiler(orden.id, nuevoEstado)
            setDetalle(null)
            setRecarga((n) => n + 1)
        } catch (err) {
            setErrorAccion(mensajeDeError(err))
        } finally {
            setGuardando(false)
        }
    }

    const totalPaginas = Math.max(1, Math.ceil(datos.total / TAMANO_PAGINA))
    const acciones = detalle ? (TRANSICIONES[detalle.estado] ?? []) : []

    return (
        <AppLayout titulo="Órdenes de Alquiler">
            <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-gray-400">
                    {cargando ? 'Cargando…' : `${datos.total} órdenes (datos reales via gateway)`}
                </p>
                <div className="flex items-center gap-2">
                    <select
                        value={filtro}
                        onChange={(e) => cambiarFiltro(e.target.value)}
                        className={filtroCls}
                    >
                        {filtros.map((f) => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                </div>
            </div>

            {datos.error && !cargando && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                    {datos.error}
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                            <th className="px-4 py-3 font-medium">Orden</th>
                            <th className="px-4 py-3 font-medium">Cliente</th>
                            <th className="px-4 py-3 font-medium">Fecha del evento</th>
                            <th className="px-4 py-3 font-medium">Devolución</th>
                            <th className="px-4 py-3 font-medium">Estado</th>
                            <th className="px-4 py-3 font-medium">Total</th>
                            <th className="px-4 py-3 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!cargando &&
                            datos.contenido.map((o) => (
                                <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-400">#{o.id}</td>
                                    <td className="px-4 py-3 text-gray-700">{o.clienteNombre}</td>
                                    <td className="px-4 py-3 text-gray-700">{o.fechaEvento}</td>
                                    <td className="px-4 py-3 text-gray-700">{o.fechaDevolucion ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <Badge estado={o.estado} />
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{formatoGs(o.total)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => abrirDetalle(o)}
                                            className="text-blue-600 hover:underline text-xs"
                                        >
                                            Ver
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
                {!cargando && !datos.error && datos.contenido.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">
                        No hay órdenes que coincidan con el filtro.
                    </p>
                )}
            </div>

            <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />

            <Modal
                abierto={!!detalle}
                titulo={`Detalle de orden #${detalle?.id ?? ''}`}
                onCerrar={() => setDetalle(null)}
                ancho="max-w-2xl"
            >
                {detalle && (
                    <div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                            <div>
                                <p className="text-xs text-gray-400">Cliente</p>
                                <p className="text-gray-900 font-medium">{detalle.clienteNombre}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Estado</p>
                                <Badge estado={detalle.estado} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Fecha del evento</p>
                                <p className="text-gray-900 font-medium">{detalle.fechaEvento}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Devolución</p>
                                <p className="text-gray-900 font-medium">{detalle.fechaDevolucion ?? '—'}</p>
                            </div>
                        </div>

                        <table className="w-full text-sm mb-4">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                                    <th className="py-2 font-medium">Equipo</th>
                                    <th className="py-2 font-medium">Cant.</th>
                                    <th className="py-2 font-medium">Días</th>
                                    <th className="py-2 font-medium">Precio/día</th>
                                    <th className="py-2 font-medium text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(detalle.detalles ?? []).map((l) => (
                                    <tr key={l.id} className="border-b border-gray-50">
                                        <td className="py-2 text-gray-700">{l.equipoNombre}</td>
                                        <td className="py-2 text-gray-700">{l.cantidad}</td>
                                        <td className="py-2 text-gray-700">{l.dias}</td>
                                        <td className="py-2 text-gray-700">{formatoGs(l.precioDia)}</td>
                                        <td className="py-2 text-gray-700 text-right">{formatoGs(l.subtotal)}</td>
                                    </tr>
                                ))}
                                {(detalle.detalles ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-4 text-center text-gray-400 text-xs">
                                            Esta orden no tiene líneas de detalle.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <div className="flex items-center justify-between text-sm font-semibold text-gray-900 mb-6">
                            <span>Total</span>
                            <span>{formatoGs(detalle.total)}</span>
                        </div>

                        {errorAccion && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                                {errorAccion}
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setDetalle(null)}
                                className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition"
                            >
                                Cerrar
                            </button>
                            {acciones.map((estado) => (
                                <button
                                    key={estado}
                                    disabled={guardando}
                                    onClick={() => cambiarEstado(detalle, estado)}
                                    className={`disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition ${
                                        estado === 'ANULADA'
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    {textoAccion[estado]}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>
        </AppLayout>
    )
}
