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
import { mensajeDeError } from '../api/client'
import { actualizarUsuario, asignarRoles, crearUsuario, desactivarUsuario, listarRoles, listarUsuarios } from '../api/usuarios'
import { useConsulta } from '../hooks/useConsulta'
import { useAuth } from '../context/useAuth'

// ====== Pantalla REAL: usuarios y roles de ms-seguridad (solo ADMIN) ======
// Alta con roles, cambio de roles y baja lógica. La contraseña se guarda con
// BCrypt en el servidor; la UI nunca la vuelve a mostrar.

const colorRol = {
    ADMIN: 'bg-purple-100 text-purple-600',
    ENCARGADO_COMPRAS: 'bg-blue-100 text-blue-600',
    ENCARGADO_DEPOSITO: 'bg-green-100 text-green-600',
}

function ChipRol({ rol }) {
    return (
        <span
            className={`text-xs px-2 py-1 rounded-full font-medium mr-1 ${colorRol[rol] ?? 'bg-gray-100 text-gray-600'}`}
        >
            {rol}
        </span>
    )
}

const TAMANO_PAGINA = 8

export default function Usuarios() {
    const [pagina, setPagina] = useState(0)
    const { user } = useAuth()
    const [busqueda, setBusqueda] = useState('')
    const [modal, setModal] = useState(null) // { id|null, nombre, email, password, roles:Set }
    const [errorForm, setErrorForm] = useState('')
    const [errorAccion, setErrorAccion] = useState('')
    const [guardando, setGuardando] = useState(false)

    const { datos, error, cargando, recargar } = useConsulta(() => listarUsuarios(), [])
    const { datos: rolesDatos } = useConsulta(() => listarRoles(), [])
    const usuarios = Array.isArray(datos) ? datos : []
    const roles = Array.isArray(rolesDatos) ? rolesDatos : []

    const filtrados = usuarios.filter((u) =>
        `${u.nombre} ${u.email} ${(u.roles ?? []).join(' ')}`
            .toLowerCase()
            .includes(busqueda.toLowerCase()),
    )

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / TAMANO_PAGINA))
    const paginaActual = Math.min(pagina, totalPaginas - 1)
    const visibles = filtrados.slice(paginaActual * TAMANO_PAGINA, (paginaActual + 1) * TAMANO_PAGINA)

    function abrirNuevo() {
        setErrorForm('')
        setModal({ id: null, nombre: '', email: '', password: '', roles: [] })
    }

    function abrirRoles(u) {
        setErrorForm('')
        setModal({ id: u.id, nombre: u.nombre, email: u.email, password: '', roles: [...(u.roles ?? [])] })
    }

    function alternarRol(nombre) {
        setModal((m) => ({
            ...m,
            roles: m.roles.includes(nombre) ? m.roles.filter((r) => r !== nombre) : [...m.roles, nombre],
        }))
    }

    async function guardar(e) {
        e.preventDefault()
        if (modal.roles.length === 0) {
            setErrorForm('Elegí al menos un rol.')
            return
        }
        if (!modal.nombre.trim() || !modal.email.trim() || !modal.password) {
            setErrorForm(
                modal.id
                    ? 'Nombre, email y contraseña son obligatorios (al editar se define una contraseña nueva).'
                    : 'Nombre, email y contraseña son obligatorios.',
            )
            return
        }
        setGuardando(true)
        setErrorForm('')
        try {
            if (modal.id) {
                await actualizarUsuario(modal.id, {
                    nombre: modal.nombre.trim(),
                    email: modal.email.trim(),
                    password: modal.password,
                })
                await asignarRoles(modal.id, modal.roles)
            } else {
                await crearUsuario({
                    nombre: modal.nombre.trim(),
                    email: modal.email.trim(),
                    password: modal.password,
                    roles: modal.roles,
                })
            }
            setModal(null)
            recargar()
        } catch (err) {
            setErrorForm(mensajeDeError(err, 'No se pudo guardar el usuario'))
        } finally {
            setGuardando(false)
        }
    }

    async function desactivar(u) {
        if (!window.confirm(`¿Desactivar a ${u.email}? Ya no podrá iniciar sesión.`)) return
        setErrorAccion('')
        try {
            await desactivarUsuario(u.id)
            recargar()
        } catch (err) {
            setErrorAccion(mensajeDeError(err))
        }
    }

    return (
        <AppLayout titulo="Usuarios">
            <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-gray-400">
                    {cargando ? 'Cargando…' : `${filtrados.length} usuarios`}
                </p>
                <div className="flex items-center gap-2">
                    <input
                        value={busqueda}
                        onChange={(e) => {
                            setBusqueda(e.target.value)
                            setPagina(0)
                        }}
                        className={filtroCls}
                        placeholder="Buscar usuario…"
                    />
                    <BotonPrimario onClick={abrirNuevo}>+ Nuevo usuario</BotonPrimario>
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
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Roles</th>
                                <th className="px-4 py-3 font-medium">Estado</th>
                                <th className="px-4 py-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibles.map((u) => (
                                <tr
                                    key={u.id}
                                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                                >
                                    <td className="px-4 py-3 text-gray-700">{u.nombre}</td>
                                    <td className="px-4 py-3 text-gray-700">{u.email}</td>
                                    <td className="px-4 py-3">
                                        {(u.roles ?? []).map((r) => (
                                            <ChipRol key={r} rol={r} />
                                        ))}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                u.activo
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}
                                        >
                                            {u.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-3">
                                        <button
                                            onClick={() => abrirRoles(u)}
                                            className="text-blue-600 hover:underline text-xs"
                                        >
                                            Editar
                                        </button>
                                        {u.email !== user?.email && (
                                            <button
                                                onClick={() => desactivar(u)}
                                                className="text-red-500 hover:underline text-xs"
                                            >
                                                Desactivar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!cargando && !error && filtrados.length === 0 && (
                    <SinDatos mensaje="No hay usuarios que coincidan con la búsqueda." />
                )}
            </div>

            <Paginacion pagina={paginaActual} totalPaginas={totalPaginas} onCambiar={setPagina} />

            <Modal
                abierto={!!modal}
                titulo={modal?.id ? 'Editar usuario' : 'Nuevo usuario'}
                onCerrar={() => setModal(null)}
            >
                {modal && (
                    <form onSubmit={guardar}>
                                <Campo label="Nombre *">
                                    <input
                                        value={modal.nombre}
                                        onChange={(e) => setModal({ ...modal, nombre: e.target.value })}
                                        className={inputCls}
                                    />
                                </Campo>
                                <Campo label="Email *">
                                    <input
                                        type="email"
                                        value={modal.email}
                                        onChange={(e) => setModal({ ...modal, email: e.target.value })}
                                        className={inputCls}
                                    />
                                </Campo>
                                <Campo label={modal.id ? 'Nueva contraseña *' : 'Contraseña *'}>
                                    <input
                                        type="password"
                                        value={modal.password}
                                        onChange={(e) => setModal({ ...modal, password: e.target.value })}
                                        className={inputCls}
                                        autoComplete="new-password"
                                    />
                                </Campo>
                        <div className="mb-4">
                            <span className="block text-xs text-gray-500 mb-2">Roles *</span>
                            {roles.length === 0 && (
                                <p className="text-xs text-gray-400">No se pudieron cargar los roles.</p>
                            )}
                            {roles.map((r) => (
                                <label key={r.id} className="flex items-start gap-2 text-sm text-gray-700 mb-2">
                                    <input
                                        type="checkbox"
                                        checked={modal.roles.includes(r.nombre)}
                                        onChange={() => alternarRol(r.nombre)}
                                        className="mt-1"
                                    />
                                    <span>
                                        {r.nombre}
                                        {r.descripcion && (
                                            <span className="block text-xs text-gray-400">{r.descripcion}</span>
                                        )}
                                    </span>
                                </label>
                            ))}
                        </div>

                        {errorForm && <p className="text-red-500 text-xs mb-3">{errorForm}</p>}

                        <div className="flex justify-end gap-2">
                            <BotonSecundario type="button" onClick={() => setModal(null)}>
                                Cancelar
                            </BotonSecundario>
                            <BotonPrimario type="submit" disabled={guardando}>
                                {guardando ? 'Guardando…' : 'Guardar'}
                            </BotonPrimario>
                        </div>
                    </form>
                )}
            </Modal>
        </AppLayout>
    )
}
