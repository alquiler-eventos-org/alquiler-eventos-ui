import { useEffect, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import {
    Badge,
    BotonPrimario,
    BotonSecundario,
    Campo,
    Modal,
    Paginacion,
    filtroCls,
    inputCls,
} from '../components/UI'
import LineasEditor from '../components/LineasEditor'
import { LINEA_VACIA, lineasADetalles } from '../utils/lineas'
import { useConsulta } from '../hooks/useConsulta'
import { listarClientes } from '../api/clientes'
import { listarEquipos } from '../api/equipos'
import { formatoFecha, formatoGs, resumenEquipos } from '../utils/formato'
import { mensajeDeError, normalizarPagina } from '../api/client'
import {
    TRANSICIONES,
    actualizarOrdenAlquiler,
    cambiarEstadoOrdenAlquiler,
    crearOrdenAlquiler,
    listarOrdenesAlquiler,
} from '../api/ordenesAlquiler'

// ====== Pantalla REAL: órdenes de alquiler desde ms-alquiler via el API Gateway ======
// El filtro por estado se hace en el servidor; la búsqueda por cliente/equipo y la
// paginación se hacen en el cliente sobre las órdenes cargadas (hasta 200).

const TAMANO_PAGINA = 6
const MAX_CARGA = 200
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
    const [busqueda, setBusqueda] = useState('')
    const [recarga, setRecarga] = useState(0)
    const [datos, setDatos] = useState({ clave: null, contenido: [], total: 0, error: '' })
    const [detalle, setDetalle] = useState(null)
    const [errorAccion, setErrorAccion] = useState('')
    const [guardando, setGuardando] = useState(false)

    // Alta de orden: cliente, fechas y líneas de equipos
    const [nueva, setNueva] = useState(null)
    const [errorNueva, setErrorNueva] = useState('')
    const { datos: clientesDatos } = useConsulta(() => listarClientes({ page: 0, size: 100 }), [])
    const { datos: equiposDatos } = useConsulta(() => listarEquipos({}), [])
    const clientes = clientesDatos ? normalizarPagina(clientesDatos).contenido : []
    // Si GET /equipos no está disponible, el editor pide el ID a mano.
    const equipos = equiposDatos ? normalizarPagina(equiposDatos).contenido : null

    // La "clave" identifica la consulta actual; mientras los datos guardados no
    // correspondan a ella, la pantalla está cargando.
    const clave = `${filtro}|${recarga}`
    const cargando = datos.clave !== clave

    useEffect(() => {
        let activo = true
        const estado = filtro === 'Todas' ? undefined : filtro
        listarOrdenesAlquiler({ page: 0, size: MAX_CARGA, estado })
            .then((resp) => {
                const p = normalizarPagina(resp.data, 0, MAX_CARGA)
                if (activo) setDatos({ clave, contenido: p.contenido, total: p.totalElementos, error: '' })
            })
            .catch((err) => {
                if (activo) setDatos({ clave, contenido: [], total: 0, error: mensajeDeError(err) })
            })
        return () => {
            activo = false
        }
    }, [clave, filtro])

    const filtradas = datos.contenido.filter((o) =>
        `${o.clienteNombre} ${o.estado} ${(o.detalles ?? []).map((d) => d.equipoNombre).join(' ')}`
            .toLowerCase()
            .includes(busqueda.toLowerCase()),
    )
    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / TAMANO_PAGINA))
    const paginaActual = Math.min(pagina, totalPaginas - 1)
    const visibles = filtradas.slice(paginaActual * TAMANO_PAGINA, (paginaActual + 1) * TAMANO_PAGINA)

    function cambiarFiltro(nuevo) {
        setFiltro(nuevo)
        setPagina(0)
    }

    function abrirDetalle(orden) {
        setErrorAccion('')
        setDetalle(orden)
    }

    async function cambiarEstado(orden, nuevoEstado) {
        if (!window.confirm(`¿Pasar la orden de ${orden.clienteNombre} a ${nuevoEstado}?`)) return
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

    function abrirNueva() {
        setErrorNueva('')
        setNueva({ clienteId: '', fechaEvento: '', fechaDevolucion: '', lineas: [{ ...LINEA_VACIA }] })
    }

    // Edición: carga la orden en el mismo formulario del alta (solo en RESERVA).
    function abrirEditar(orden) {
        setErrorNueva('')
        setDetalle(null)
        setNueva({
            id: orden.id,
            clienteId: String(orden.clienteId ?? ''),
            fechaEvento: orden.fechaEvento ?? '',
            fechaDevolucion: orden.fechaDevolucion ?? '',
            lineas: (orden.detalles ?? []).map((d) => ({
                equipoId: String(d.equipoId),
                cantidad: d.cantidad,
                costoUnitario: '',
            })),
        })
    }

    async function guardarNueva(e) {
        e.preventDefault()
        const detalles = lineasADetalles(nueva.lineas)
        if (!nueva.clienteId || !nueva.fechaEvento) {
            setErrorNueva('Elegí el cliente y la fecha del evento.')
            return
        }
        if (detalles.length === 0 || detalles.some((d) => !(d.cantidad >= 1))) {
            setErrorNueva('Agregá al menos un equipo con cantidad válida.')
            return
        }
        setGuardando(true)
        setErrorNueva('')
        try {
            const cuerpo = {
                clienteId: Number(nueva.clienteId),
                fechaEvento: nueva.fechaEvento,
                fechaDevolucion: nueva.fechaDevolucion || null,
                detalles,
            }
            if (nueva.id) await actualizarOrdenAlquiler(nueva.id, cuerpo)
            else await crearOrdenAlquiler(cuerpo)
            setNueva(null)
            setPagina(0)
            setBusqueda('')
            setRecarga((n) => n + 1)
        } catch (err) {
            setErrorNueva(mensajeDeError(err, 'No se pudo guardar la orden'))
        } finally {
            setGuardando(false)
        }
    }

    const acciones = detalle ? (TRANSICIONES[detalle.estado] ?? []) : []

    return (
        <AppLayout titulo="Órdenes de Alquiler">
            <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-gray-400">
                    {cargando ? 'Cargando…' : `${filtradas.length} órdenes`}
                </p>
                <div className="flex items-center gap-2">
                    <input
                        value={busqueda}
                        onChange={(e) => {
                            setBusqueda(e.target.value)
                            setPagina(0)
                        }}
                        className={filtroCls}
                        placeholder="Buscar por cliente o equipo…"
                    />
                    <select
                        value={filtro}
                        onChange={(e) => cambiarFiltro(e.target.value)}
                        className={filtroCls}
                    >
                        {filtros.map((f) => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                    <BotonPrimario onClick={abrirNueva}>+ Nueva orden</BotonPrimario>
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
                            <th className="px-4 py-3 font-medium">Equipos</th>
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
                            visibles.map((o) => (
                                <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-700">{o.clienteNombre}</td>
                                    <td className="px-4 py-3 text-gray-500">{resumenEquipos((o.detalles ?? []).map((d) => ({ nombre: d.equipoNombre, cantidad: d.cantidad })))}</td>
                                    <td className="px-4 py-3 text-gray-700">{formatoFecha(o.fechaEvento)}</td>
                                    <td className="px-4 py-3 text-gray-700">{formatoFecha(o.fechaDevolucion)}</td>
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
                {!cargando && !datos.error && filtradas.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">
                        No hay órdenes que coincidan con la búsqueda.
                    </p>
                )}
            </div>

            <Paginacion pagina={paginaActual} totalPaginas={totalPaginas} onCambiar={setPagina} />

            <Modal
                abierto={!!nueva}
                titulo={nueva?.id ? 'Editar orden de alquiler' : 'Nueva orden de alquiler'}
                onCerrar={() => setNueva(null)}
                ancho="max-w-xl"
            >
                {nueva && (
                    <form onSubmit={guardarNueva}>
                        <Campo label="Cliente *">
                            <select
                                value={nueva.clienteId}
                                onChange={(e) => setNueva({ ...nueva, clienteId: e.target.value })}
                                className={inputCls}
                            >
                                <option value="">Elegir cliente…</option>
                                {clientes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.nombre} {c.apellido} — {c.documento}
                                    </option>
                                ))}
                            </select>
                        </Campo>
                        <div className="grid grid-cols-2 gap-x-4">
                            <Campo label="Fecha del evento *">
                                <input
                                    type="date"
                                    value={nueva.fechaEvento}
                                    onChange={(e) => setNueva({ ...nueva, fechaEvento: e.target.value })}
                                    className={inputCls}
                                />
                            </Campo>
                            <Campo label="Devolución">
                                <input
                                    type="date"
                                    value={nueva.fechaDevolucion}
                                    onChange={(e) => setNueva({ ...nueva, fechaDevolucion: e.target.value })}
                                    className={inputCls}
                                />
                            </Campo>
                        </div>
                        <LineasEditor
                            lineas={nueva.lineas}
                            onChange={(lineas) => setNueva({ ...nueva, lineas })}
                            equipos={equipos}
                        />
                        <p className="text-xs text-gray-400 mb-4">
                            Los días, subtotales y el total los calcula el servidor. La orden nace en estado RESERVA.
                        </p>
                        {errorNueva && <p className="text-red-500 text-xs mb-3">{errorNueva}</p>}
                        <div className="flex justify-end gap-2">
                            <BotonSecundario type="button" onClick={() => setNueva(null)}>
                                Cancelar
                            </BotonSecundario>
                            <BotonPrimario type="submit" disabled={guardando}>
                                {guardando ? 'Guardando…' : nueva.id ? 'Guardar cambios' : 'Crear orden'}
                            </BotonPrimario>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal
                abierto={!!detalle}
                titulo={`Orden de ${detalle?.clienteNombre ?? ''}`}
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
                                <p className="text-gray-900 font-medium">{formatoFecha(detalle.fechaEvento)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Devolución</p>
                                <p className="text-gray-900 font-medium">{formatoFecha(detalle.fechaDevolucion)}</p>
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
                            {detalle.estado === 'RESERVA' && (
                                <button
                                    onClick={() => abrirEditar(detalle)}
                                    className="border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm font-medium px-4 py-2 rounded-lg transition"
                                >
                                    Editar
                                </button>
                            )}
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
