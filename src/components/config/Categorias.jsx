import { useState } from 'react'
import { useConfirmar } from '../../context/useConfirmar'
import Fila from './Fila'
import { BotonPrimario, BotonSecundario, Cargando, ErrorBanner, SinDatos, inputCls } from '../UI'
import { mensajeDeError } from '../../api/client'
import { actualizarCategoria, crearCategoria, eliminarCategoria } from '../../api/configuracion'
import { listarCategorias } from '../../api/equipos'
import { useConsulta } from '../../hooks/useConsulta'

// Categorías de equipos (Sonido, Mesas, Sillas, Carpas…): crear, renombrar y eliminar.
// Aparecen como opciones al crear o editar un equipo. Las administra el encargado de
// compras (y el administrador).

export default function Categorias() {
    const confirmar = useConfirmar()
    const { datos, error, cargando, recargar } = useConsulta(() => listarCategorias(), [])
    const categorias = Array.isArray(datos) ? datos : []
    const [nueva, setNueva] = useState('')
    const [editando, setEditando] = useState(null) // { id, nombre }
    const [errorAccion, setErrorAccion] = useState('')
    const [ocupado, setOcupado] = useState(false)

    async function ejecutar(accion) {
        setOcupado(true)
        setErrorAccion('')
        try {
            await accion()
            recargar()
        } catch (err) {
            setErrorAccion(mensajeDeError(err))
        } finally {
            setOcupado(false)
        }
    }

    async function agregar(e) {
        e.preventDefault()
        if (!nueva.trim()) return
        await ejecutar(async () => {
            await crearCategoria(nueva.trim())
            setNueva('')
        })
    }

    async function guardarEdicion() {
        if (!editando?.nombre.trim()) return
        await ejecutar(async () => {
            await actualizarCategoria(editando.id, editando.nombre.trim())
            setEditando(null)
        })
    }

    async function quitar(cat) {
        if (!(await confirmar(`¿Eliminar la categoría "${cat.nombre}"?`))) return
        await ejecutar(() => eliminarCategoria(cat.id))
    }

    return (
        <section className="space-y-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Catálogos</h2>
            <Fila
                titulo="Categorías de equipos"
                descripcion="Sonido, Mesas, Sillas, Carpas… Se ofrecen al crear o editar un equipo. No se puede eliminar una categoría que tenga equipos."
                ancha
            >
                <div>
                    <form onSubmit={agregar} className="flex gap-2 mb-4">
                        <input
                            value={nueva}
                            onChange={(e) => setNueva(e.target.value)}
                            className={inputCls}
                            placeholder="Nueva categoría (por ejemplo: Iluminación)"
                            maxLength={100}
                        />
                        <BotonPrimario type="submit" disabled={ocupado || !nueva.trim()}>
                            Agregar
                        </BotonPrimario>
                    </form>

                    {(error || errorAccion) && (
                        <div className="mb-3">
                            <ErrorBanner mensaje={error || errorAccion} onReintentar={error ? recargar : undefined} />
                        </div>
                    )}

                    {cargando ? (
                        <Cargando />
                    ) : categorias.length === 0 ? (
                        <SinDatos mensaje="Todavía no hay categorías." />
                    ) : (
                        <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                            {categorias.map((cat) => (
                                <li key={cat.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                                    {editando?.id === cat.id ? (
                                        <>
                                            <input
                                                value={editando.nombre}
                                                onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                                                className={inputCls}
                                                maxLength={100}
                                                autoFocus
                                            />
                                            <span className="flex gap-2 shrink-0">
                                                <BotonPrimario onClick={guardarEdicion} disabled={ocupado}>
                                                    Guardar
                                                </BotonPrimario>
                                                <BotonSecundario onClick={() => setEditando(null)}>
                                                    Cancelar
                                                </BotonSecundario>
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-gray-700">{cat.nombre}</span>
                                            <span className="space-x-3 shrink-0">
                                                <button
                                                    onClick={() => setEditando({ id: cat.id, nombre: cat.nombre })}
                                                    className="text-blue-600 hover:underline text-xs"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => quitar(cat)}
                                                    disabled={ocupado}
                                                    className="text-red-500 hover:underline text-xs"
                                                >
                                                    Eliminar
                                                </button>
                                            </span>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </Fila>
        </section>
    )
}
