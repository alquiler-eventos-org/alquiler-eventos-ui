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
import { actualizarCliente, crearCliente, eliminarCliente, listarClientes } from '../api/clientes'
import { mensajeDeError, normalizarPagina } from '../api/client'
import { useConsulta } from '../hooks/useConsulta'

// ====== Pantalla REAL: clientes de ms-alquiler via el API Gateway ======
// Listado paginado y búsqueda en el servidor; alta, edición y baja lógica.

const TAMANO_PAGINA = 6
const FORM_VACIO = {
    nombre: '',
    apellido: '',
    documento: '',
    telefono: '',
    email: '',
    direccion: '',
    notas: '',
}

export default function Clientes() {
    const [pagina, setPagina] = useState(0)
    const [busqueda, setBusqueda] = useState('')
    const [termino, setTermino] = useState('')
    const [modal, setModal] = useState({ abierto: false, id: null })
    const [form, setForm] = useState(FORM_VACIO)
    const [errorForm, setErrorForm] = useState('')
    const [errorAccion, setErrorAccion] = useState('')
    const [guardando, setGuardando] = useState(false)

    const { datos, error, cargando, recargar } = useConsulta(
        () => listarClientes({ page: pagina, size: TAMANO_PAGINA, busqueda: termino }),
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

    function abrirEdicion(c) {
        setForm({
            nombre: c.nombre ?? '',
            apellido: c.apellido ?? '',
            documento: c.documento ?? '',
            telefono: c.telefono ?? '',
            email: c.email ?? '',
            direccion: c.direccion ?? '',
            notas: c.notas ?? '',
        })
        setErrorForm('')
        setModal({ abierto: true, id: c.id })
    }

    function cambiar(campo, valor) {
        setForm((f) => ({ ...f, [campo]: valor }))
    }

    async function guardar(e) {
        e.preventDefault()
        if (!form.nombre.trim() || !form.apellido.trim() || !form.documento.trim()) {
            setErrorForm('Nombre, apellido y documento son obligatorios.')
            return
        }
        // Los campos vacíos van como null (email y documento son únicos en la base).
        const request = Object.fromEntries(
            Object.entries(form).map(([k, v]) => [k, v.trim() === '' ? null : v.trim()]),
        )
        setGuardando(true)
        setErrorForm('')
        try {
            if (modal.id) await actualizarCliente(modal.id, request)
            else await crearCliente(request)
            setModal({ abierto: false, id: null })
            recargar()
        } catch (err) {
            setErrorForm(mensajeDeError(err, 'No se pudo guardar el cliente'))
        } finally {
            setGuardando(false)
        }
    }

    async function eliminar(c) {
        if (!window.confirm(`¿Dar de baja a ${c.nombre} ${c.apellido}? (borrado lógico)`)) return
        setErrorAccion('')
        try {
            await eliminarCliente(c.id)
            recargar()
        } catch (err) {
            setErrorAccion(mensajeDeError(err))
        }
    }

    return (
        <AppLayout titulo="Clientes">
            <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-gray-400">
                    {cargando ? 'Cargando…' : `${p?.totalElementos ?? 0} clientes`}
                </p>
                <div className="flex items-center gap-2">
                    <form onSubmit={buscar} className="flex gap-2">
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className={filtroCls}
                            placeholder="Nombre, documento o email…"
                        />
                        <BotonSecundario type="submit">Buscar</BotonSecundario>
                    </form>
                    <BotonPrimario onClick={abrirNuevo}>+ Nuevo cliente</BotonPrimario>
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
                                <th className="px-4 py-3 font-medium">Documento</th>
                                <th className="px-4 py-3 font-medium">Teléfono</th>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Estado</th>
                                <th className="px-4 py-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(p?.contenido ?? []).map((c) => (
                                <tr
                                    key={c.id}
                                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                                >
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
                                        <button
                                            onClick={() => abrirEdicion(c)}
                                            className="text-blue-600 hover:underline text-xs"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => eliminar(c)}
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
                    <SinDatos mensaje="No hay clientes que coincidan con la búsqueda." />
                )}
            </div>

            <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />

            <Modal
                abierto={modal.abierto}
                titulo={modal.id ? `Editar cliente #${modal.id}` : 'Nuevo cliente'}
                onCerrar={() => setModal({ abierto: false, id: null })}
            >
                <form onSubmit={guardar}>
                    <div className="grid grid-cols-2 gap-x-4">
                        <Campo label="Nombre *">
                            <input
                                value={form.nombre}
                                onChange={(e) => cambiar('nombre', e.target.value)}
                                className={inputCls}
                            />
                        </Campo>
                        <Campo label="Apellido *">
                            <input
                                value={form.apellido}
                                onChange={(e) => cambiar('apellido', e.target.value)}
                                className={inputCls}
                            />
                        </Campo>
                        <Campo label="Documento *">
                            <input
                                value={form.documento}
                                onChange={(e) => cambiar('documento', e.target.value)}
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
                    <Campo label="Notas">
                        <textarea
                            rows={2}
                            value={form.notas}
                            onChange={(e) => cambiar('notas', e.target.value)}
                            className={inputCls}
                        />
                    </Campo>

                    {errorForm && (
                        <p className="text-red-500 text-xs mb-3">{errorForm}</p>
                    )}

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
