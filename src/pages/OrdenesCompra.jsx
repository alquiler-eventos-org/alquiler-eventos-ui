import { useState } from 'react'
import { useConfirmar } from '../context/useConfirmar'
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
import { hoyISO } from '../utils/resumen'
import { mensajeDeError, normalizarPagina } from '../api/client'
import { useConsulta } from '../hooks/useConsulta'
import { crearProveedor, listarProveedores } from '../api/proveedores'
import { crearEquipo, listarCategorias, listarEquipos } from '../api/equipos'
import {
    cambiarEstadoOrdenCompra,
    crearOrdenCompra,
    listarOrdenesCompra,
    obtenerOrdenCompra,
} from '../api/ordenesCompra'
import MontoInput from '../components/MontoInput'

// ====== Pantalla REAL: FACTURAS DE COMPRA (ms-compras via el API Gateway) ======
// La factura se registra directa: nace RECIBIDA y suma el stock en el momento (sin
// estados). Trae número de factura, RUC/CI, condición (contado o crédito) y permite
// crear un proveedor o un producto nuevo desde el mismo formulario.
// Las órdenes viejas (PENDIENTE/CONFIRMADA) conservan sus botones para poder cerrarlas.

const TAMANO_PAGINA = 6
const MAX_CARGA = 200
const filtros = ['Todas', 'CONTADO', 'CREDITO']
const PROVEEDOR_VACIO = { nombre: '', contacto: '', telefono: '', email: '' }
const PRODUCTO_VACIO = { nombre: '', categoriaId: '', precioDia: '' }

function CondicionTag({ condicion }) {
    if (!condicion) return <span className="text-gray-300">—</span>
    const color = condicion === 'CREDITO' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-600'
    return (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${color}`}>
            {condicion === 'CREDITO' ? 'CRÉDITO' : 'CONTADO'}
        </span>
    )
}

// Solo para órdenes antiguas anteriores a la factura directa.
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
    const confirmar = useConfirmar()
    const [pagina, setPagina] = useState(0)
    const [filtro, setFiltro] = useState('Todas')
    const [busqueda, setBusqueda] = useState('')
    const [detalle, setDetalle] = useState(null)
    const [errorAccion, setErrorAccion] = useState('')
    const [guardando, setGuardando] = useState(false)
    const [nueva, setNueva] = useState(null)
    const [errorNueva, setErrorNueva] = useState('')
    const [provNuevo, setProvNuevo] = useState(null) // formulario inline de proveedor
    const [prodNuevo, setProdNuevo] = useState(null) // formulario inline de producto
    const [errorInline, setErrorInline] = useState('')

    const { datos, error, cargando, recargar } = useConsulta(
        () => listarOrdenesCompra({ page: 0, size: MAX_CARGA }),
        [],
    )
    const p = datos ? normalizarPagina(datos, 0, MAX_CARGA) : null

    // Nombres: la orden trae proveedorId / equipoId; se resuelven con estas listas.
    const { datos: proveedoresDatos, recargar: recargarProveedores } = useConsulta(
        () => listarProveedores({ page: 0, size: 100 }),
        [],
    )
    const { datos: equiposDatos, recargar: recargarEquipos } = useConsulta(() => listarEquipos({}), [])
    const { datos: categoriasDatos } = useConsulta(() => listarCategorias(), [])
    const categorias = categoriasDatos ? normalizarPagina(categoriasDatos).contenido : []
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

    const filtradas = (p?.contenido ?? [])
        .filter((o) => filtro === 'Todas' || o.condicionPago === filtro)
        .filter((o) =>
            `${nombreProveedor(o)} ${o.numeroFactura ?? ''} ${o.ruc ?? ''} ${o.ci ?? ''} ${(o.detalles ?? []).map(nombreEquipo).join(' ')}`
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

    async function abrirDetalle(orden) {
        setErrorAccion('')
        setDetalle(orden)
        // GET /ordenes-compra/{id}: Redis (MISS la 1ra vez, HIT despues)
        try {
            const { data } = await obtenerOrdenCompra(orden.id)
            if (data) setDetalle((d) => (d?.id === orden.id ? { ...orden, ...data } : d))
        } catch {
            // se queda con los datos de la fila
        }
    }

    async function cambiarEstado(orden, nuevoEstado) {
        if (!(await confirmar(`¿Pasar la orden de ${nombreProveedor(orden)} a ${nuevoEstado}?`))) return
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
        setErrorInline('')
        setProvNuevo(null)
        setProdNuevo(null)
        setNueva({
            proveedorId: '',
            numeroFactura: '',
            ruc: '',
            ci: '',
            condicionPago: 'CONTADO',
            fechaVencimiento: '',
            fechaCompra: hoyISO(),
            observaciones: '',
            lineas: [{ ...LINEA_VACIA }],
        })
    }

    // Alta de proveedor sin salir de la factura: se crea y queda elegido.
    async function guardarProveedorNuevo() {
        if (!provNuevo.nombre.trim()) {
            setErrorInline('El nombre del proveedor es obligatorio.')
            return
        }
        setGuardando(true)
        setErrorInline('')
        try {
            const cuerpo = { nombre: provNuevo.nombre.trim() }
            if (provNuevo.contacto.trim()) cuerpo.contacto = provNuevo.contacto.trim()
            if (provNuevo.telefono.trim()) cuerpo.telefono = provNuevo.telefono.trim()
            if (provNuevo.email.trim()) cuerpo.email = provNuevo.email.trim()
            const { data } = await crearProveedor(cuerpo)
            recargarProveedores()
            setNueva((n) => ({ ...n, proveedorId: String(data.id) }))
            setProvNuevo(null)
        } catch (err) {
            setErrorInline(mensajeDeError(err, 'No se pudo crear el proveedor'))
        } finally {
            setGuardando(false)
        }
    }

    // Alta de producto (equipo) sin salir de la factura: nace con stock 0 y la propia
    // factura le suma las unidades compradas.
    async function guardarProductoNuevo() {
        if (!prodNuevo.nombre.trim() || !prodNuevo.categoriaId || prodNuevo.precioDia === '') {
            setErrorInline('Completá nombre, categoría y precio por día del producto.')
            return
        }
        setGuardando(true)
        setErrorInline('')
        try {
            const { data } = await crearEquipo({
                nombre: prodNuevo.nombre.trim(),
                categoriaId: Number(prodNuevo.categoriaId),
                stock: 0,
                precioDia: Number(prodNuevo.precioDia),
                estado: 'DISPONIBLE',
            })
            recargarEquipos()
            setNueva((n) => {
                const vacia = n.lineas.findIndex((l) => l.equipoId === '')
                const linea = { ...LINEA_VACIA, equipoId: String(data.id) }
                const lineas =
                    vacia >= 0 ? n.lineas.map((l, i) => (i === vacia ? { ...l, equipoId: String(data.id) } : l)) : [...n.lineas, linea]
                return { ...n, lineas }
            })
            setProdNuevo(null)
        } catch (err) {
            setErrorInline(mensajeDeError(err, 'No se pudo crear el producto'))
        } finally {
            setGuardando(false)
        }
    }

    async function guardarNueva(e) {
        e.preventDefault()
        const detalles = lineasADetalles(nueva.lineas, true)
        if (!nueva.proveedorId || !nueva.fechaCompra) {
            setErrorNueva('Elegí el proveedor y la fecha de la factura.')
            return
        }
        if (!nueva.numeroFactura.trim()) {
            setErrorNueva('Ingresá el número de factura.')
            return
        }
        if (!nueva.ruc.trim() && !nueva.ci.trim()) {
            setErrorNueva('Ingresá el RUC o la CI del proveedor.')
            return
        }
        if (nueva.condicionPago === 'CREDITO' && !nueva.fechaVencimiento) {
            setErrorNueva('Una factura a crédito necesita fecha de vencimiento.')
            return
        }
        if (
            detalles.length === 0 ||
            detalles.some((d) => !(d.cantidad >= 1) || !(d.costoUnitario > 0) || Number.isNaN(d.costoUnitario))
        ) {
            setErrorNueva('Agregá al menos un producto con cantidad y costo unitario mayores a cero.')
            return
        }
        setGuardando(true)
        setErrorNueva('')
        try {
            const cuerpo = {
                proveedorId: Number(nueva.proveedorId),
                fechaCompra: nueva.fechaCompra,
                numeroFactura: nueva.numeroFactura.trim(),
                condicionPago: nueva.condicionPago,
                detalles,
            }
            if (nueva.ruc.trim()) cuerpo.ruc = nueva.ruc.trim()
            if (nueva.ci.trim()) cuerpo.ci = nueva.ci.trim()
            if (nueva.condicionPago === 'CREDITO') cuerpo.fechaVencimiento = nueva.fechaVencimiento
            if (nueva.observaciones.trim()) cuerpo.observaciones = nueva.observaciones.trim()
            await crearOrdenCompra(cuerpo)
            setNueva(null)
            setPagina(0)
            recargar()
            recargarEquipos()
        } catch (err) {
            setErrorNueva(mensajeDeError(err, 'No se pudo registrar la factura de compra'))
        } finally {
            setGuardando(false)
        }
    }

    const totalNueva = nueva
        ? nueva.lineas.reduce((acc, l) => acc + Number(l.cantidad || 0) * Number(l.costoUnitario || 0), 0)
        : 0

    const acciones = detalle ? (TRANSICIONES[detalle.estado] ?? []) : []

    return (
        <AppLayout titulo="Facturas de Compra">
            <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-gray-400">
                    {cargando ? 'Cargando…' : `${filtradas.length} facturas`}
                </p>
                <div className="flex items-center gap-2">
                    <input
                        value={busqueda}
                        onChange={(e) => {
                            setBusqueda(e.target.value)
                            setPagina(0)
                        }}
                        className={filtroCls}
                        placeholder="Buscar por proveedor, N° de factura o equipo…"
                    />
                    <select
                        value={filtro}
                        onChange={(e) => cambiarFiltro(e.target.value)}
                        className={filtroCls}
                    >
                        {filtros.map((f) => (
                            <option key={f} value={f}>
                                {f === 'CREDITO' ? 'CRÉDITO' : f === 'Todas' ? 'Todas las condiciones' : f}
                            </option>
                        ))}
                    </select>
                    <BotonPrimario onClick={abrirNueva}>+ Nueva factura de compra</BotonPrimario>
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
                                <th className="px-4 py-3 font-medium">Fecha</th>
                                <th className="px-4 py-3 font-medium">N° factura</th>
                                <th className="px-4 py-3 font-medium">Proveedor</th>
                                <th className="px-4 py-3 font-medium">Condición</th>
                                <th className="px-4 py-3 font-medium">Equipos</th>
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
                                    <td className="px-4 py-3 text-gray-700">{formatoFecha(o.fechaCompra)}</td>
                                    <td className="px-4 py-3 text-gray-700">{o.numeroFactura ?? '—'}</td>
                                    <td className="px-4 py-3 text-gray-700">{nombreProveedor(o)}</td>
                                    <td className="px-4 py-3">
                                        <CondicionTag condicion={o.condicionPago} />
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{resumenEquipos((o.detalles ?? []).map((l) => ({ nombre: nombreEquipo(l), cantidad: l.cantidad })))}</td>
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
                    <SinDatos mensaje="No hay facturas que coincidan con la búsqueda." />
                )}
            </div>

            <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />

            <Modal
                abierto={!!nueva}
                titulo="Factura de compra"
                onCerrar={() => setNueva(null)}
                ancho="max-w-2xl"
            >
                {nueva && (
                    <form onSubmit={guardarNueva}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                            <Campo label="N° de factura *">
                                <input
                                    value={nueva.numeroFactura}
                                    onChange={(e) => setNueva({ ...nueva, numeroFactura: e.target.value })}
                                    className={inputCls}
                                    placeholder="001-001-0000123"
                                />
                            </Campo>
                            <Campo label="Fecha de la factura *">
                                <input
                                    type="date"
                                    value={nueva.fechaCompra}
                                    onChange={(e) => setNueva({ ...nueva, fechaCompra: e.target.value })}
                                    className={inputCls}
                                />
                            </Campo>
                        </div>

                        <Campo label="Proveedor *">
                            <div className="flex gap-2">
                                <select
                                    value={nueva.proveedorId}
                                    onChange={(e) => setNueva({ ...nueva, proveedorId: e.target.value })}
                                    className={`${inputCls} min-w-0`}
                                >
                                    <option value="">Elegir proveedor…</option>
                                    {proveedores.map((pr) => (
                                        <option key={pr.id} value={pr.id}>{pr.nombre}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setErrorInline('')
                                        setProvNuevo(provNuevo ? null : { ...PROVEEDOR_VACIO })
                                    }}
                                    className="whitespace-nowrap text-xs text-blue-600 hover:underline"
                                >
                                    + Nuevo proveedor
                                </button>
                            </div>
                        </Campo>

                        {provNuevo && (
                            <div className="border border-blue-100 bg-blue-50/40 rounded-lg p-3 mb-4">
                                <p className="text-xs font-medium text-gray-700 mb-2">Nuevo proveedor</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input
                                        value={provNuevo.nombre}
                                        onChange={(e) => setProvNuevo({ ...provNuevo, nombre: e.target.value })}
                                        className={inputCls}
                                        placeholder="Nombre *"
                                    />
                                    <input
                                        value={provNuevo.contacto}
                                        onChange={(e) => setProvNuevo({ ...provNuevo, contacto: e.target.value })}
                                        className={inputCls}
                                        placeholder="Contacto"
                                    />
                                    <input
                                        value={provNuevo.telefono}
                                        onChange={(e) => setProvNuevo({ ...provNuevo, telefono: e.target.value })}
                                        className={inputCls}
                                        placeholder="Teléfono"
                                    />
                                    <input
                                        type="email"
                                        value={provNuevo.email}
                                        onChange={(e) => setProvNuevo({ ...provNuevo, email: e.target.value })}
                                        className={inputCls}
                                        placeholder="Email"
                                    />
                                </div>
                                {errorInline && !prodNuevo && <p className="text-red-500 text-xs mt-2">{errorInline}</p>}
                                <div className="flex justify-end gap-2 mt-3">
                                    <BotonSecundario type="button" onClick={() => setProvNuevo(null)}>
                                        Cancelar
                                    </BotonSecundario>
                                    <BotonPrimario type="button" disabled={guardando} onClick={guardarProveedorNuevo}>
                                        Guardar proveedor
                                    </BotonPrimario>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                            <Campo label="RUC">
                                <input
                                    value={nueva.ruc}
                                    onChange={(e) => setNueva({ ...nueva, ruc: e.target.value })}
                                    className={inputCls}
                                    placeholder="80012345-6"
                                />
                            </Campo>
                            <Campo label="CI">
                                <input
                                    value={nueva.ci}
                                    onChange={(e) => setNueva({ ...nueva, ci: e.target.value })}
                                    className={inputCls}
                                    placeholder="Si el proveedor es persona física"
                                />
                            </Campo>
                            <Campo label="Condición de pago *">
                                <select
                                    value={nueva.condicionPago}
                                    onChange={(e) => setNueva({ ...nueva, condicionPago: e.target.value })}
                                    className={inputCls}
                                >
                                    <option value="CONTADO">Contado</option>
                                    <option value="CREDITO">Crédito</option>
                                </select>
                            </Campo>
                            {nueva.condicionPago === 'CREDITO' && (
                                <Campo label="Vencimiento *">
                                    <input
                                        type="date"
                                        value={nueva.fechaVencimiento}
                                        onChange={(e) => setNueva({ ...nueva, fechaVencimiento: e.target.value })}
                                        className={inputCls}
                                    />
                                </Campo>
                            )}
                        </div>

                        <LineasEditor
                            lineas={nueva.lineas}
                            onChange={(lineas) => setNueva({ ...nueva, lineas })}
                            equipos={equipos}
                            conCosto
                            etiqueta="Productos"
                            textoAgregar="+ Agregar producto"
                            accionExtra={
                                <button
                                    type="button"
                                    onClick={() => {
                                        setErrorInline('')
                                        setProdNuevo(prodNuevo ? null : { ...PRODUCTO_VACIO })
                                    }}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    + Nuevo producto
                                </button>
                            }
                        />

                        {prodNuevo && (
                            <div className="border border-blue-100 bg-blue-50/40 rounded-lg p-3 mb-4">
                                <p className="text-xs font-medium text-gray-700 mb-2">Nuevo producto</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <input
                                        value={prodNuevo.nombre}
                                        onChange={(e) => setProdNuevo({ ...prodNuevo, nombre: e.target.value })}
                                        className={inputCls}
                                        placeholder="Nombre *"
                                    />
                                    <select
                                        value={prodNuevo.categoriaId}
                                        onChange={(e) => setProdNuevo({ ...prodNuevo, categoriaId: e.target.value })}
                                        className={inputCls}
                                    >
                                        <option value="">Categoría *</option>
                                        {categorias.map((c) => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                    <MontoInput
                                        value={prodNuevo.precioDia}
                                        onChange={(valor) => setProdNuevo({ ...prodNuevo, precioDia: valor })}
                                        placeholder="Precio por día *"
                                    />
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2">
                                    Nace con stock 0; esta factura le suma las unidades compradas.
                                </p>
                                {errorInline && <p className="text-red-500 text-xs mt-2">{errorInline}</p>}
                                <div className="flex justify-end gap-2 mt-3">
                                    <BotonSecundario type="button" onClick={() => setProdNuevo(null)}>
                                        Cancelar
                                    </BotonSecundario>
                                    <BotonPrimario type="button" disabled={guardando} onClick={guardarProductoNuevo}>
                                        Guardar producto
                                    </BotonPrimario>
                                </div>
                            </div>
                        )}

                        <Campo label="Observaciones">
                            <input
                                value={nueva.observaciones}
                                onChange={(e) => setNueva({ ...nueva, observaciones: e.target.value })}
                                className={inputCls}
                                maxLength={255}
                            />
                        </Campo>

                        <div className="flex items-center justify-between text-sm font-semibold text-gray-900 mb-1">
                            <span>Total estimado</span>
                            <span>{formatoGs(totalNueva)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">
                            Al guardar, la factura se registra como recibida y suma el stock de los productos al instante.
                            El servidor recalcula los subtotales y el total.
                        </p>
                        {errorNueva && <p className="text-red-500 text-xs mb-3">{errorNueva}</p>}
                        <div className="flex justify-end gap-2">
                            <BotonSecundario type="button" onClick={() => setNueva(null)}>
                                Cancelar
                            </BotonSecundario>
                            <BotonPrimario type="submit" disabled={guardando}>
                                {guardando ? 'Guardando…' : 'Registrar factura'}
                            </BotonPrimario>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal
                abierto={!!detalle}
                titulo={`Factura ${detalle?.numeroFactura ?? ''} · ${detalle ? nombreProveedor(detalle) : ''}`}
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
                                <p className="text-xs text-gray-400">Fecha de la factura</p>
                                <p className="text-gray-900 font-medium">{formatoFecha(detalle.fechaCompra)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">N° de factura</p>
                                <p className="text-gray-900 font-medium">{detalle.numeroFactura ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">RUC / CI</p>
                                <p className="text-gray-900 font-medium">
                                    {[detalle.ruc, detalle.ci].filter(Boolean).join(' / ') || '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Condición de pago</p>
                                <CondicionTag condicion={detalle.condicionPago} />
                                {detalle.condicionPago === 'CREDITO' && detalle.fechaVencimiento && (
                                    <span className="ml-2 text-xs text-gray-500">
                                        vence {formatoFecha(detalle.fechaVencimiento)}
                                    </span>
                                )}
                            </div>
                            {detalle.observaciones && (
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-400">Observaciones</p>
                                    <p className="text-gray-900">{detalle.observaciones}</p>
                                </div>
                            )}
                            {TRANSICIONES[detalle.estado]?.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-400">Estado (orden anterior)</p>
                                    <Badge estado={detalle.estado} />
                                </div>
                            )}
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
                                            Esta factura no tiene líneas de detalle.
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
