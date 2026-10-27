import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import {
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
import {
    actualizarProveedor,
    buscarProveedores,
    crearProveedor,
    eliminarProveedor,
    listarProveedores,
} from '../api/proveedores'
import { mensajeDeError, normalizarPagina } from '../api/client'
import { useConsulta } from '../hooks/useConsulta'

// ====== Pantalla REAL: proveedores de ms-compras via el API Gateway ======

const TAMANO_PAGINA = 6
const FORM_VACIO = { nombre: '', contacto: '', telefono: '', email: '', direccion: '' }

export default function Proveedores() {
    const [pagina, setPagina] = useState(0)
    const [busqueda, setBusqueda] = useState('')
    const [termino, setTermino] = useState('')
    const [modal, setModal] = useState({ abierto: false, id: null })
    const [form, setForm] = useState(FORM_VACIO)
    const [errorForm, setErrorForm] = useState('')
    const [errorAccion, setErrorAccion] = useState('')
    const [guardando, setGuardando] = useState(false)

    const { datos, error, cargando, recargar } = useConsulta(
        () =>
            termino
                ? buscarProveedores({ nombre: termino, page: pagina, size: TAMANO_PAGINA })
                : listarProveedores({ page: pagina, size: TAMANO_PAGINA }),
        [pagina, termino],
    )
    const p = datos ? normalizarPagina(datos, pagina, TAMANO_PAGINA) : null
    const totalPaginas = Math.max(1, Math.ceil((p?.totalElementos ?? 0) / TAMANO_PAGINA))

    function buscar(e) {
        e.preventDefault()
        setPagina(0)
        setTermino(busqueda.trim())
    }

    function abrirNuevo() {
        setForm(FORM_VACIO)
        setErrorForm('')
        setModal({ abierto: true, id: null })
    }

    function abrirEdicion(pr) {
        setForm({
            nombre: pr.nombre ?? '',
            contacto: pr.contacto ?? '',
            telefono: pr.telefono ?? '',
            email: pr.email ?? '',
            direccion: pr.direccion ?? '',
        })
        setErrorForm('')
        setModal({ abierto: true, id: pr.id })
    }

    function cambiar(campo, valor) {
        setForm((f) => ({ ...f, [campo]: valor }))
    }

    async function guardar(e) {
        e.preventDefault()
        if (!form.nombre.trim()) {
            setErrorForm('El nombre es obligatorio.')
            return
        }
        const request = Object.fromEntries(
            Object.entries(form).map(([k, v]) => [k, v.trim() === '' ? null : v.trim()]),
        )
        setGuardando(true)
        setErrorForm('')
        try {
            if (modal.id) await actualizarProveedor(modal.id, request)
            else await crearProveedor(request)
            setModal({ abierto: false, id: null })
            recargar()
        } catch (err) {
            setErrorForm(mensajeDeError(err, 'No se pudo guardar el proveedor'))
        } finally {
            setGuardando(false)
        }
    }

    async function eliminar(pr) {
        if (!window.confirm(`¿Dar de baja a ${pr.nombre}? (borrado lógico)`)) return
        setErrorAccion('')
        try {
            await eliminarProveedor(pr.id)
            recargar()
        } catch (err) {
            setErrorAccion(mensajeDeError(err))
        }
    }

    return (
        <AppLayout titulo="Proveedores">
            <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-gray-400">
                    {cargando ? 'Cargando…' : `${p?.totalElementos ?? 0} proveedores`}
                </p>
                <div className="flex items-center gap-2">
                    <form onSubmit={buscar} className="flex gap-2">
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className={filtroCls}
                            placeholder="Buscar por nombre…"
                        />
                        <BotonSecundario type="submit">Buscar</BotonSecundario>
                    </form>
                    <BotonPrimario onClick={abrirNuevo}>+ Nuevo proveedor</BotonPrimario>
                </div>
            </div>

            {(error || errorAccion) && (
                <div className="mb-4">
                    <ErrorBanner mensaje={error || errorAccion} onReintentar={recargar} />
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                {cargando && !p ? (
                    <Cargando />
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                                <th className="px-4 py-3 font-medium">Nombre</th>
                                <th className="px-4 py-3 font-medium">Contacto</th>
                                <th className="px-4 py-3 font-medium">Teléfono</th>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Estado</th>
                                <th className="px-4 py-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(p?.contenido ?? []).map((pr) => (
                                <tr
                                    key={pr.id}
                                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                                >
                                    <td className="px-4 py-3 text-gray-700">{pr.nombre}</td>
                                    <td className="px-4 py-3 text-gray-700">{pr.contacto}</td>
                                    <td className="px-4 py-3 text-gray-700">{pr.telefono}</td>
                                    <td className="px-4 py-3 text-gray-700">{pr.email}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                pr.activo
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}
                                        >
                                            {pr.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-3">
                                        <button
                                            onClick={() => abrirEdicion(pr)}
                                            className="text-blue-600 hover:underline text-xs"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => eliminar(pr)}
                                            className="text-red-500 hover:underline text-xs"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!cargando && !error && (p?.contenido ?? []).length === 0 && (
                    <SinDatos mensaje="No hay proveedores que coincidan con la búsqueda." />
                )}
            </div>

            <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />

            <Modal
                abierto={modal.abierto}
                titulo={modal.id ? `Editar proveedor #${modal.id}` : 'Nuevo proveedor'}
                onCerrar={() => setModal({ abierto: false, id: null })}
            >
                <form onSubmit={guardar}>
                    <Campo label="Nombre *">
                        <input
                            value={form.nombre}
                            onChange={(e) => cambiar('nombre', e.target.value)}
                            className={inputCls}
                        />
                    </Campo>
                    <div className="grid grid-cols-2 gap-x-4">
                        <Campo label="Contacto">
                            <input
                                value={form.contacto}
                                onChange={(e) => cambiar('contacto', e.target.value)}
                                className={inputCls}
                            />
                        </Campo>
                        <Campo label="Teléfono">
                            <input
                                value={form.telefono}
                                onChange={(e) => cambiar('telefono', e.target.value)}
                                className={inputCls}
                            />
                        </Campo>
                    </div>
                    <Campo label="Email">
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => cambiar('email', e.target.value)}
                            className={inputCls}
                        />
                    </Campo>
                    <Campo label="Dirección">
                        <input
                            value={form.direccion}
                            onChange={(e) => cambiar('direccion', e.target.value)}
                            className={inputCls}
                        />
                    </Campo>

                    {errorForm && <p className="text-red-500 text-xs mb-3">{errorForm}</p>}

                    <div className="flex justify-end gap-2">
                        <BotonSecundario
                            type="button"
                            onClick={() => setModal({ abierto: false, id: null })}
                        >
                            Cancelar
                        </BotonSecundario>
                        <BotonPrimario type="submit" disabled={guardando}>
                            {guardando ? 'Guardando…' : 'Guardar'}
                        </BotonPrimario>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    )
}
