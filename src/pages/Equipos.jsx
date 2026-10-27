import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import {
    Badge,
    BotonSecundario,
    Cargando,
    ErrorBanner,
    Modal,
    Paginacion,
    SinDatos,
    filtroCls,
} from '../components/UI'
import { formatoGs } from '../utils/formato'
import { descargarCsv } from '../utils/csv'
import { normalizarPagina } from '../api/client'
import { listarEquipos } from '../api/equipos'
import { useConsulta } from '../hooks/useConsulta'

// ====== Pantalla REAL: equipos y stock desde ms-alquiler (GET /equipos) ======
// Solo lectura: el stock lo mueven las órdenes de alquiler (ENTREGA descuenta,
// DEVOLUCION devuelve) y las de compra. El filtro y la paginación se hacen en
// el navegador porque el inventario es chico (se piden hasta 200 equipos).

const TAMANO_PAGINA = 8
const STOCK_BAJO = 2

export default function Equipos() {
    const [pagina, setPagina] = useState(0)
    const [busqueda, setBusqueda] = useState('')
    const [categoria, setCategoria] = useState('Todas')
    const [detalle, setDetalle] = useState(null)

    const { datos, error, cargando, recargar } = useConsulta(() => listarEquipos({}), [])
    const equipos = datos ? normalizarPagina(datos).contenido : []

    const categorias = ['Todas', ...new Set(equipos.map((e) => e.categoria).filter(Boolean))]
    const filtrados = equipos.filter(
        (e) =>
            e.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
            (categoria === 'Todas' || e.categoria === categoria),
    )
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / TAMANO_PAGINA))
    const paginaActual = Math.min(pagina, totalPaginas - 1)
    const visibles = filtrados.slice(paginaActual * TAMANO_PAGINA, (paginaActual + 1) * TAMANO_PAGINA)

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
                </div>
            </div>

            {error && (
                <div className="mb-4">
                    <ErrorBanner mensaje={error} onReintentar={recargar} />
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
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => setDetalle(eq)}
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
                {!cargando && !error && filtrados.length === 0 && (
                    <SinDatos mensaje="No hay equipos que coincidan con el filtro." />
                )}
            </div>

            <Paginacion pagina={paginaActual} totalPaginas={totalPaginas} onCambiar={setPagina} />

            <p className="text-xs text-gray-400 mt-4">
                Solo lectura: el stock cambia con las órdenes de alquiler (entrega y devolución) y de compra.
            </p>

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
