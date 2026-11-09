import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import {
    Badge,
    BotonPrimario,
    BotonSecundario,
    Cargando,
    ErrorBanner,
    Paginacion,
    SinDatos,
    filtroCls,
} from '../components/UI'
import { useAuth } from '../context/useAuth'
import { ROLES, tieneRol } from '../api/sesion'
import { normalizarPagina } from '../api/client'
import { listarProveedores } from '../api/proveedores'
import { listarOrdenesCompra } from '../api/ordenesCompra'
import { formatoFecha, formatoGs, resumenEquipos } from '../utils/formato'
import { descargarCsv } from '../utils/csv'
import { useConsulta } from '../hooks/useConsulta'
import {
    cargarResumen,
    enRango,
    equiposAfuera,
    hoyISO,
    primerDiaMesISO,
    ultimoDiaMesISO,
} from '../utils/resumen'
import { listarEquipos } from '../api/equipos'

// ====== Reportes con datos reales ======
// Reporte simple: un filtro de fechas, unos pocos totales y las dos listas principales
// (actividad de alquiler y actividad de compras). No hay endpoints de reportes: se
// calcula en el navegador con las órdenes que devuelven ms-alquiler y ms-compras
// (hasta 500 de cada una). Las anuladas se listan pero no suman. Cada rol ve solo su
// módulo; el administrador ve ambos. El botón de imprimir está arriba.

const POR_PAGINA = 8
const suma = (lista) => lista.reduce((acc, o) => acc + Number(o.total ?? 0), 0)
const vigentes = (lista) => lista.filter((o) => o.estado !== 'ANULADA')

function Kpi({ label, valor }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{valor}</p>
        </div>
    )
}

function Tabla({ titulo, columnas, filas, vacio }) {
    const [pagina, setPagina] = useState(0)
    const totalPaginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA))
    const actual = Math.min(pagina, totalPaginas - 1)
    const visibles = filas.slice(actual * POR_PAGINA, (actual + 1) * POR_PAGINA)
    return (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">{titulo}</h2>
                <span className="text-xs text-gray-400">{filas.length} registros</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                            {columnas.map((c) => (
                                <th key={c} className="px-4 py-3 font-medium">{c}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibles.map((f) => (
                            <tr key={f.clave} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                {f.celdas.map((celda, i) => (
                                    <td key={i} className="px-4 py-3 text-gray-700">{celda}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filas.length === 0 && <SinDatos mensaje={vacio} />}
            </div>
            <div className="px-4 pb-3">
                <Paginacion pagina={actual} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </div>
        </div>
    )
}

export default function Reportes() {
    const { user } = useAuth()
    const veAlquiler = tieneRol(user, ROLES.alquiler)
    const veCompras = tieneRol(user, ROLES.compras)

    const [desde, setDesde] = useState(primerDiaMesISO())
    const [hasta, setHasta] = useState(ultimoDiaMesISO())

    const { datos, cargando } = useConsulta(
        async () => ({
            data: {
                alquiler: veAlquiler ? await cargarResumen({ alquiler: true, compras: false }) : null,
                compras: veCompras
                    ? {
                          ordenes: await listarOrdenesCompra({ page: 0, size: 500 })
                              .then((r) => normalizarPagina(r.data).contenido)
                              .catch(() => null),
                          proveedores: await listarProveedores({ page: 0, size: 200 })
                              .then((r) => normalizarPagina(r.data).contenido)
                              .catch(() => []),
                          equipos: await listarEquipos({})
                              .then((r) => normalizarPagina(r.data).contenido)
                              .catch(() => []),
                      }
                    : null,
            },
        }),
        [veAlquiler, veCompras],
    )

    const ordenesAlq = datos?.alquiler?.ordenes ?? null
    const ordenesCom = datos?.compras?.ordenes ?? null
    const proveedores = datos?.compras?.proveedores ?? []
    const equiposCat = datos?.compras?.equipos ?? []

    const alqPeriodo = ordenesAlq ? ordenesAlq.filter((o) => enRango(o.fechaEvento, desde, hasta)) : []
    const comPeriodo = ordenesCom ? ordenesCom.filter((o) => enRango(o.fechaCompra, desde, hasta)) : []

    const nombreProveedor = (o) =>
        o.proveedorNombre ?? proveedores.find((p) => p.id === o.proveedorId)?.nombre ?? 'Proveedor'
    const nombreEquipo = (l) =>
        l.equipoNombre ?? equiposCat.find((e) => e.id === l.equipoId)?.nombre ?? 'Equipo'

    const filasAlquiler = [...alqPeriodo]
        .sort((a, b) => String(b.fechaEvento).localeCompare(String(a.fechaEvento)))
        .map((o) => ({
            clave: `a${o.id}`,
            celdas: [
                formatoFecha(o.fechaEvento),
                o.clienteNombre,
                resumenEquipos((o.detalles ?? []).map((d) => ({ nombre: d.equipoNombre, cantidad: d.cantidad }))),
                formatoFecha(o.fechaDevolucion),
                <Badge key="e" estado={o.estado} />,
                formatoGs(o.total),
            ],
        }))
    const filasCompras = [...comPeriodo]
        .sort((a, b) => String(b.fechaCompra).localeCompare(String(a.fechaCompra)))
        .map((o) => ({
            clave: `c${o.id}`,
            celdas: [
                formatoFecha(o.fechaCompra),
                o.numeroFactura ?? '—',
                nombreProveedor(o),
                o.condicionPago === 'CREDITO' ? 'Crédito' : o.condicionPago === 'CONTADO' ? 'Contado' : '—',
                resumenEquipos((o.detalles ?? []).map((l) => ({ nombre: nombreEquipo(l), cantidad: l.cantidad }))),
                formatoGs(o.total),
            ],
        }))

    function rangoRapido(d, h) {
        setDesde(d)
        setHasta(h)
    }

    function exportar() {
        const filas = []
        if (ordenesAlq) {
            filas.push(['Actividad de alquiler'], ['Fecha del evento', 'Cliente', 'Equipos', 'Devolución', 'Estado', 'Total'])
            alqPeriodo.forEach((o) =>
                filas.push([
                    formatoFecha(o.fechaEvento),
                    o.clienteNombre,
                    (o.detalles ?? []).map((d) => `${d.equipoNombre} x${d.cantidad}`).join(' | '),
                    formatoFecha(o.fechaDevolucion),
                    o.estado,
                    o.total,
                ]),
            )
            filas.push([])
        }
        if (ordenesCom) {
            filas.push(['Actividad de compras'], ['Fecha de la factura', 'N° factura', 'Proveedor', 'Condición', 'Equipos', 'Total'])
            comPeriodo.forEach((o) =>
                filas.push([
                    formatoFecha(o.fechaCompra),
                    o.numeroFactura ?? '',
                    nombreProveedor(o),
                    o.condicionPago ?? '',
                    (o.detalles ?? []).map((l) => `${nombreEquipo(l)} x${l.cantidad}`).join(' | '),
                    o.total,
                ]),
            )
        }
        descargarCsv(`reporte-${desde || 'inicio'}-a-${hasta || 'hoy'}.csv`, filas)
    }

    const sinDatos = !cargando && !ordenesAlq && !ordenesCom

    return (
        <AppLayout titulo="Reportes">
            {cargando && <Cargando />}
            {sinDatos && (
                <ErrorBanner mensaje="No se pudieron cargar las órdenes. ¿Está corriendo el backend?" />
            )}

            {!cargando && (ordenesAlq || ordenesCom) && (
                <>
                    {/* Filtro de fechas + acciones (imprimir arriba, sin tener que bajar) */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-end gap-3 print:hidden">
                        <label className="text-xs text-gray-500">
                            Desde
                            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={`${filtroCls} block mt-1`} />
                        </label>
                        <label className="text-xs text-gray-500">
                            Hasta
                            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={`${filtroCls} block mt-1`} />
                        </label>
                        <div className="flex gap-2">
                            <BotonSecundario onClick={() => rangoRapido(hoyISO(), hoyISO())}>Hoy</BotonSecundario>
                            <BotonSecundario onClick={() => rangoRapido(primerDiaMesISO(), ultimoDiaMesISO())}>Este mes</BotonSecundario>
                            <BotonSecundario onClick={() => rangoRapido('', '')}>Todo</BotonSecundario>
                        </div>
                        <div className="flex gap-2 ml-auto">
                            <BotonSecundario onClick={exportar}>Exportar CSV</BotonSecundario>
                            <BotonPrimario onClick={() => window.print()}>Imprimir / guardar PDF</BotonPrimario>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {ordenesAlq && (
                            <>
                                <Kpi label="Ingresos por alquiler" valor={formatoGs(suma(vigentes(alqPeriodo)))} />
                                <Kpi label="Órdenes de alquiler" valor={vigentes(alqPeriodo).length} />
                                <Kpi label="Equipos afuera ahora" valor={equiposAfuera(ordenesAlq)} />
                                <Kpi label="Equipos en mora" valor={equiposAfuera(ordenesAlq, 'MORA')} />
                            </>
                        )}
                        {ordenesCom && (
                            <>
                                <Kpi label="Gasto en compras" valor={formatoGs(suma(vigentes(comPeriodo)))} />
                                <Kpi label="Facturas de compra" valor={vigentes(comPeriodo).length} />
                            </>
                        )}
                    </div>

                    {ordenesAlq && (
                        <Tabla
                            titulo="Actividad de alquiler"
                            columnas={['Fecha del evento', 'Cliente', 'Equipos', 'Devolución', 'Estado', 'Total']}
                            filas={filasAlquiler}
                            vacio="No hay alquileres en estas fechas."
                        />
                    )}
                    {ordenesCom && (
                        <Tabla
                            titulo="Actividad de compras"
                            columnas={['Fecha de la factura', 'N° factura', 'Proveedor', 'Condición', 'Equipos', 'Total']}
                            filas={filasCompras}
                            vacio="No hay compras en estas fechas."
                        />
                    )}

                    <p className="text-xs text-gray-400">
                        Alquileres por fecha del evento · compras por fecha de factura. Las órdenes anuladas
                        aparecen en la lista pero no suman en los totales.
                    </p>
                </>
            )}
        </AppLayout>
    )
}
