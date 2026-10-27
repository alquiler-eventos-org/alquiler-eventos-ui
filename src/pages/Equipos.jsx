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
import { formatoGs } from '../utils/formato'
import { descargarCsv } from '../utils/csv'
import { mensajeDeError, normalizarPagina } from '../api/client'
import {
    actualizarEquipo,
    crearEquipo,
    darDeBajaEquipo,
    listarCategorias,
    listarEquipos,
} from '../api/equipos'
import { useConsulta } from '../hooks/useConsulta'
import MontoInput from '../components/MontoInput'

// ====== Pantalla REAL: equipos y stock desde ms-alquiler (GET /equipos) ======
// CRUD: alta, edición y baja lógica (estado BAJA). El stock también lo mueven las
// órdenes de alquiler (ENTREGA descuenta, DEVOLUCION devuelve) y las de compra. El filtro y la paginación se hacen en
// el navegador porque el inventario es chico (se piden hasta 200 equipos).

const TAMANO_PAGINA = 8
const STOCK_BAJO = 2

export default function Equipos() {
    const [pagina, setPagina] = useState(0)
    const [busqueda, setBusqueda] = useState('')
    const [categoria, setCategoria] = useState('Todas')
    const [detalle, setDetalle] = useState(null)
    const [form, setForm] = useState(null) // { id|null, nombre, categoriaId, stock, precioDia, estado }
    const [errorForm, setErrorForm] = useState('')
    const [errorAccion, setErrorAccion] = useState('')
    const [guardando, setGuardando] = useState(false)

    const { datos, error, cargando, recargar } = useConsulta(() => listarEquipos({}), [])
    const equipos = datos ? normalizarPagina(datos).contenido : []
    const { datos: categoriasDatos } = useConsulta(() => listarCategorias(), [])
    const catalogo = Array.isArray(categoriasDatos) ? categoriasDatos : []

    const categorias = ['Todas', ...new Set(equipos.map((e) => e.categoria).filter(Boolean))]
    const filtrados = equipos.filter(
        (e) =>
            e.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
            (categoria === 'Todas' || e.categoria === categoria),
    )
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / TAMANO_PAGINA))
    const paginaActual = Math.min(pagina, totalPaginas - 1)
    const visibles = filtrados.slice(paginaActual * TAMANO_PAGINA, (paginaActual + 1) * TAMANO_PAGINA)

    function abrirNuevo() {
        setErrorForm('')
        setForm({ id: null, nombre: '', categoriaId: '', stock: 0, precioDia: '', estado: 'DISPONIBLE' })
    }

    function abrirEditar(eq) {
        setErrorForm('')
        setDetalle(null)
        setForm({
            id: eq.id,
            nombre: eq.nombre,
            categoriaId: String(eq.categoriaId ?? ''),
            stock: eq.stock,
            precioDia: String(eq.precioDia ?? ''),
            estado: eq.estado ?? 'DISPONIBLE',
        })
    }

    async function guardar(e) {
        e.preventDefault()
        if (!form.nombre.trim() || !form.categoriaId || form.precioDia === '') {
            setErrorForm('Nombre, categoría y precio por día son obligatorios.')
            return
        }
        if (!(Number(form.stock) >= 0) || !(Number(form.precioDia) >= 0)) {
            setErrorForm('El stock y el precio no pueden ser negativos.')
            return
        }
        setGuardando(true)
        setErrorForm('')
        const cuerpo = {
            nombre: form.nombre.trim(),
            categoriaId: Number(form.categoriaId),
            stock: Number(form.stock),
            precioDia: Number(form.precioDia),
            estado: form.estado,
        }
        try {
            if (form.id) await actualizarEquipo(form.id, cuerpo)
            else await crearEquipo(cuerpo)
            setForm(null)
            recargar()
        } catch (err) {
            setErrorForm(mensajeDeError(err, 'No se pudo guardar el equipo'))
        } finally {
            setGuardando(false)
        }
    }

    async function darDeBaja(eq) {
        if (!window.confirm(`¿Dar de baja "${eq.nombre}"? Quedará en estado BAJA.`)) return
        setErrorAccion('')
        try {
            await darDeBajaEquipo(eq.id)
            setDetalle(null)
            recargar()
        } catch (err) {
            setErrorAccion(mensajeDeError(err))
        }
    }

    function exportar() {
        descargarCsv('equipos.csv', [
            ['Nombre', 'Categoría', 'Stock', 'Precio/día', 'Estado'],
            ...filtrados.map((e) => [e.nombre, e.categoria, e.stock, e.precioDia, e.estado]),
        ])
    }

    return (
        <AppLayout titulo="Equipos">
            <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-gray-400">
                    {cargando ? 'Cargando…' : `${filtrados.length} equipos`}
                </p>
                <div className="flex items-center gap-2">
                    <input
                        value={busqueda}
                        onChange={(e) => {
                            setBusqueda(e.target.value)
                            setPagina(0)
                        }}
                        className={filtroCls}
                        placeholder="Buscar equipo…"
                    />
                    <select
                        value={categoria}
                        onChange={(e) => {
                            setCategoria(e.target.value)
                            setPagina(0)
                        }}
                        className={filtroCls}
                    >
                        {categorias.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <BotonSecundario onClick={exportar} disabled={filtrados.length === 0}>
                        Exportar CSV
                    </BotonSecundario>
                    <BotonPrimario onClick={abrirNuevo}>+ Nuevo equipo</BotonPrimario>
                </div>
            </div>

            {(error || errorAccion) && (
                <div className="mb-4">
                    <ErrorBanner mensaje={error || errorAccion} onReintentar={recargar} />
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                {cargando ? (
                    <Cargando />
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                                <th className="px-4 py-3 font-medium">Nombre</th>
                                <th className="px-4 py-3 font-medium">Categoría</th>
                                <th className="px-4 py-3 font-medium">Stock</th>
                                <th className="px-4 py-3 font-medium">Precio/día</th>
                                <th className="px-4 py-3 font-medium">Estado</th>
                                <th className="px-4 py-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibles.map((eq) => (
                                <tr
                                    key={eq.id}
                                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                                >
                                    <td className="px-4 py-3 text-gray-700">{eq.nombre}</td>
                                    <td className="px-4 py-3 text-gray-700">{eq.categoria}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={
                                                eq.stock <= STOCK_BAJO
                                                    ? 'text-red-600 font-medium'
                                                    : 'text-gray-700'
                                            }
                                        >
                                            {eq.stock}
                                        </span>
                                        {eq.stock <= STOCK_BAJO && (
                                            <span className="ml-2 text-[10px] text-red-500">stock bajo</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{formatoGs(eq.precioDia)}</td>
                                    <td className="px-4 py-3">
                                        <Badge estado={eq.estado} />
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-3">
                                        <button
                                            onClick={() => setDetalle(eq)}
                                            className="text-blue-600 hover:underline text-xs"
                                        >
                                            Ver
                                        </button>
                                        <button
                                            onClick={() => abrirEditar(eq)}
                                            className="text-blue-600 hover:underline text-xs"
                                        >
                                            Editar
                                        </button>
                                        {eq.estado !== 'BAJA' && (
                                            <button
                                                onClick={() => darDeBaja(eq)}
                                                className="text-red-500 hover:underline text-xs"
                                            >
                                                Dar de baja
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!cargando && !error && filtrados.length === 0 && (
                    <SinDatos mensaje="No hay equipos que coincidan con el filtro." />
                )}
            </div>

            <Paginacion pagina={paginaActual} totalPaginas={totalPaginas} onCambiar={setPagina} />

            <p className="text-xs text-gray-400 mt-4">
                El stock también cambia con las órdenes de alquiler (entrega y devolución) y de compra.
            </p>

            <Modal
                abierto={!!form}
                titulo={form?.id ? 'Editar equipo' : 'Nuevo equipo'}
                onCerrar={() => setForm(null)}
            >
                {form && (
                    <form onSubmit={guardar}>
                        <Campo label="Nombre *">
                            <input
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                className={inputCls}
                            />
                        </Campo>
                        <Campo label="Categoría *">
                            <select
                                value={form.categoriaId}
                                onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                                className={inputCls}
                            >
                                <option value="">Elegir categoría…</option>
                                {catalogo.map((c) => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </Campo>
                        <div className="grid grid-cols-2 gap-x-4">
                            <Campo label="Stock *">
                                <input
                                    type="number"
                                    min="0"
                                    value={form.stock}
                                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                    className={inputCls}
                                />
                            </Campo>
                            <Campo label="Precio por día (₲) *">
                                <MontoInput
                                    min="0"
                                    value={form.precioDia}
                                    onChange={(valor) => setForm({ ...form, precioDia: valor })}
                                />
                            </Campo>
                        </div>
                        <Campo label="Estado">
                            <select
                                value={form.estado}
                                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                                className={inputCls}
                            >
                                <option value="DISPONIBLE">DISPONIBLE</option>
                                <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                                <option value="BAJA">BAJA</option>
                            </select>
                        </Campo>
                        {errorForm && <p className="text-red-500 text-xs mb-3">{errorForm}</p>}
                        <div className="flex justify-end gap-2">
                            <BotonSecundario type="button" onClick={() => setForm(null)}>
                                Cancelar
                            </BotonSecundario>
                            <BotonPrimario type="submit" disabled={guardando}>
                                {guardando ? 'Guardando…' : 'Guardar'}
                            </BotonPrimario>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal
                abierto={!!detalle}
                titulo="Detalle del equipo"
                onCerrar={() => setDetalle(null)}
            >
                {detalle && (
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">{detalle.nombre}</h3>
                        <p className="text-xs text-gray-400 mb-4">{detalle.categoria}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                            <div>
                                <p className="text-xs text-gray-400">Stock disponible</p>
                                <p className="text-gray-900 font-medium">{detalle.stock}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Precio por día</p>
                                <p className="text-gray-900 font-medium">{formatoGs(detalle.precioDia)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Estado</p>
                                <Badge estado={detalle.estado} />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <BotonSecundario onClick={() => setDetalle(null)}>Cerrar</BotonSecundario>
                        </div>
                    </div>
                )}
            </Modal>
        </AppLayout>
    )
}
