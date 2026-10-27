import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import {
    Badge,
    BotonPrimario,
    BotonSecundario,
    Campo,
    Cargando,
    ErrorBanner,
    Modal,
    Paginacion,
    SinDatos,
    filtroCls,
    inputCls,
} from '../components/UI'
import LineasEditor from '../components/LineasEditor'
import { LINEA_VACIA, lineasADetalles } from '../utils/lineas'
import { formatoFecha, formatoGs, resumenEquipos } from '../utils/formato'
import { mensajeDeError, normalizarPagina } from '../api/client'
import { useConsulta } from '../hooks/useConsulta'
import { listarProveedores } from '../api/proveedores'
import { listarEquipos } from '../api/equipos'
import {
    actualizarOrdenCompra,
    cambiarEstadoOrdenCompra,
    crearOrdenCompra,
    listarOrdenesCompra,
} from '../api/ordenesCompra'

// ====== Pantalla REAL: órdenes de compra de ms-compras via el API Gateway ======
// Estados: PENDIENTE -> CONFIRMADA -> RECIBIDA, y PENDIENTE -> ANULADA.

const TAMANO_PAGINA = 6
const MAX_CARGA = 200
const filtros = ['Todas', 'PENDIENTE', 'CONFIRMADA', 'RECIBIDA', 'ANULADA']

const TRANSICIONES = {
    PENDIENTE: ['CONFIRMADA', 'ANULADA'],
    CONFIRMADA: ['RECIBIDA'],
    RECIBIDA: [],
    ANULADA: [],
}

const textoAccion = {
    CONFIRMADA: 'Confirmar',
    RECIBIDA: 'Marcar como recibida',
    ANULADA: 'Anular',
}

export default function OrdenesCompra() {
    const [pagina, setPagina] = useState(0)
    const [filtro, setFiltro] = useState('Todas')
    const [busqueda, setBusqueda] = useState('')
    const [detalle, setDetalle] = useState(null)
    const [errorAccion, setErrorAccion] = useState('')
    const [guardando, setGuardando] = useState(false)
    const [nueva, setNueva] = useState(null)
    const [errorNueva, setErrorNueva] = useState('')

    const estado = filtro === 'Todas' ? undefined : filtro
    const { datos, error, cargando, recargar } = useConsulta(
        () =>
            listarOrdenesCompra({
                page: 0,
                size: MAX_CARGA,
                filtros: estado ? { estado } : {},
            }),
        [filtro],
    )
    const p = datos ? normalizarPagina(datos, 0, MAX_CARGA) : null

    // Nombres: la orden trae proveedorId / equipoId; se resuelven con estas listas.
    const { datos: proveedoresDatos } = useConsulta(
        () => listarProveedores({ page: 0, size: 100 }),
        [],
    )
    const { datos: equiposDatos } = useConsulta(() => listarEquipos({}), [])
    const proveedores = proveedoresDatos ? normalizarPagina(proveedoresDatos).contenido : []
    const equipos = equiposDatos ? normalizarPagina(equiposDatos).contenido : null

    const nombreProveedor = (o) =>
        o.proveedorNombre ??
        proveedores.find((pr) => pr.id === o.proveedorId)?.nombre ??
        'Proveedor'
    const nombreEquipo = (l) =>
        l.equipoNombre ??
        equipos?.find((eq) => eq.id === l.equipoId)?.nombre ??
        'Equipo'

    const filtradas = (p?.contenido ?? []).filter((o) =>
        `${nombreProveedor(o)} ${o.estado} ${(o.detalles ?? []).map(nombreEquipo).join(' ')}`
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
        if (!window.confirm(`¿Pasar la orden de ${nombreProveedor(orden)} a ${nuevoEstado}?`)) return
        setGuardando(true)
        setErrorAccion('')
        try {
            await cambiarEstadoOrdenCompra(orden.id, nuevoEstado)
            setDetalle(null)
            recargar()
        } catch (err) {
            setErrorAccion(mensajeDeError(err))
        } finally {
            setGuardando(false)
        }
    }

    function abrirNueva() {
        setErrorNueva('')
        setNueva({
            proveedorId: '',
            fechaCompra: new Date().toISOString().slice(0, 10),
            lineas: [{ ...LINEA_VACIA }],
        })
    }

    // Edición: carga la orden en el mismo formulario del alta (solo en PENDIENTE).
    function abrirEditar(orden) {
        setErrorNueva('')
        setDetalle(null)
        setNueva({
            id: orden.id,
            proveedorId: String(orden.proveedorId ?? ''),
            fechaCompra: orden.fechaCompra ?? '',
            lineas: (orden.detalles ?? []).map((l) => ({
                equipoId: String(l.equipoId),
                cantidad: l.cantidad,
                costoUnitario: String(l.costoUnitario ?? ''),
            })),
        })
    }

    async function guardarNueva(e) {
        e.preventDefault()
        const detalles = lineasADetalles(nueva.lineas, true)
        if (!nueva.proveedorId || !nueva.fechaCompra) {
            setErrorNueva('Elegí el proveedor y la fecha de compra.')
            return
        }
        if (
            detalles.length === 0 ||
            detalles.some((d) => !(d.cantidad >= 1) || !(d.costoUnitario >= 0) || Number.isNaN(d.costoUnitario))
        ) {
            setErrorNueva('Agregá al menos un equipo con cantidad y costo unitario válidos.')
            return
        }
        setGuardando(true)
        setErrorNueva('')
        try {
            const cuerpo = {
                proveedorId: Number(nueva.proveedorId),
                fechaCompra: nueva.fechaCompra,
                detalles,
            }
            if (nueva.id) await actualizarOrdenCompra(nueva.id, cuerpo)
            else await crearOrdenCompra(cuerpo)
            setNueva(null)
            setPagina(0)
            recargar()
        } catch (err) {
            setErrorNueva(mensajeDeError(err, 'No se pudo guardar la orden de compra'))
        } finally {
            setGuardando(false)
        }
    }

    const acciones = detalle ? (TRANSICIONES[detalle.estado] ?? []) : []

    return (
        <AppLayout titulo="Órdenes de Compra">
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
                        placeholder="Buscar por proveedor o equipo…"
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

            {error && (
                <div className="mb-4">
                    <ErrorBanner mensaje={error} onReintentar={recargar} />
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                {cargando && !p ? (
                    <Cargando />
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                                <th className="px-4 py-3 font-medium">Proveedor</th>
                                <th className="px-4 py-3 font-medium">Equipos</th>
                                <th className="px-4 py-3 font-medium">Fecha</th>
                                <th className="px-4 py-3 font-medium">Estado</th>
                                <th className="px-4 py-3 font-medium">Total</th>
                                <th className="px-4 py-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibles.map((o) => (
                                <tr
                                    key={o.id}
                                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                                >
                                    <td className="px-4 py-3 text-gray-700">{nombreProveedor(o)}</td>
                                    <td className="px-4 py-3 text-gray-500">{resumenEquipos((o.detalles ?? []).map((l) => ({ nombre: nombreEquipo(l), cantidad: l.cantidad })))}</td>
                                    <td className="px-4 py-3 text-gray-700">{formatoFecha(o.fechaCompra)}</td>
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
                )}
                {!cargando && !error && filtradas.length === 0 && (
                    <SinDatos mensaje="No hay órdenes que coincidan con la búsqueda." />
                )}
            </div>

            <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />

            <Modal
                abierto={!!nueva}
                titulo={nueva?.id ? 'Editar orden de compra' : 'Nueva orden de compra'}
                onCerrar={() => setNueva(null)}
                ancho="max-w-xl"
            >
                {nueva && (
                    <form onSubmit={guardarNueva}>
                        <Campo label="Proveedor *">
                            <select
                                value={nueva.proveedorId}
                                onChange={(e) => setNueva({ ...nueva, proveedorId: e.target.value })}
                                className={inputCls}
                            >
                                <option value="">Elegir proveedor…</option>
                                {proveedores.map((pr) => (
                                    <option key={pr.id} value={pr.id}>{pr.nombre}</option>
                                ))}
                            </select>
                        </Campo>
                        <Campo label="Fecha de compra *">
                            <input
                                type="date"
                                value={nueva.fechaCompra}
                                onChange={(e) => setNueva({ ...nueva, fechaCompra: e.target.value })}
                                className={inputCls}
                            />
                        </Campo>
                        <LineasEditor
                            lineas={nueva.lineas}
                            onChange={(lineas) => setNueva({ ...nueva, lineas })}
                            equipos={equipos}
                            conCosto
                        />
                        <p className="text-xs text-gray-400 mb-4">
                            Los subtotales y el total los calcula el servidor. La orden nace en estado PENDIENTE.
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
                titulo={`Orden de ${detalle ? nombreProveedor(detalle) : ''}`}
                onCerrar={() => setDetalle(null)}
                ancho="max-w-2xl"
            >
                {detalle && (
                    <div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                            <div>
                                <p className="text-xs text-gray-400">Proveedor</p>
                                <p className="text-gray-900 font-medium">{nombreProveedor(detalle)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Fecha de compra</p>
                                <p className="text-gray-900 font-medium">{formatoFecha(detalle.fechaCompra)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Estado</p>
                                <Badge estado={detalle.estado} />
                            </div>
                        </div>

                        <table className="w-full text-sm mb-4">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                                    <th className="py-2 font-medium">Equipo</th>
                                    <th className="py-2 font-medium">Cant.</th>
                                    <th className="py-2 font-medium">Costo unit.</th>
                                    <th className="py-2 font-medium text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(detalle.detalles ?? []).map((l, i) => (
                                    <tr key={l.id ?? i} className="border-b border-gray-50">
                                        <td className="py-2 text-gray-700">{nombreEquipo(l)}</td>
                                        <td className="py-2 text-gray-700">{l.cantidad}</td>
                                        <td className="py-2 text-gray-700">{formatoGs(l.costoUnitario)}</td>
                                        <td className="py-2 text-gray-700 text-right">{formatoGs(l.subtotal)}</td>
                                    </tr>
                                ))}
                                {(detalle.detalles ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-4 text-center text-gray-400 text-xs">
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
                            <BotonSecundario onClick={() => setDetalle(null)}>Cerrar</BotonSecundario>
                            {detalle.estado === 'PENDIENTE' && (
                                <button
                                    onClick={() => abrirEditar(detalle)}
                                    className="border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm font-medium px-4 py-2 rounded-lg transition"
                                >
                                    Editar
                                </button>
                            )}
                            {acciones.map((e) => (
                                <button
                                    key={e}
                                    disabled={guardando}
                                    onClick={() => cambiarEstado(detalle, e)}
                                    className={`disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition ${
                                        e === 'ANULADA'
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    {textoAccion[e]}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>
        </AppLayout>
    )
}
