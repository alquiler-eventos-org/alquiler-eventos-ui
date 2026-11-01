import { useState } from 'react'
import Fila from './Fila'
import MontoInput from '../MontoInput'
import { BotonPrimario, BotonSecundario, Cargando, ErrorBanner, inputCls } from '../UI'
import { mensajeDeError } from '../../api/client'
import {
    ejecutarRecordatorios,
    guardarConfigAlquiler,
    obtenerConfigAlquiler,
} from '../../api/configuracion'
import { useConsulta } from '../../hooks/useConsulta'
import { formatoFecha } from '../../utils/formato'

// Tarifa de mora por día, días de anticipación del recordatorio y plantilla de mail.
// Los ve y los edita el encargado de alquiler (y el administrador).

const VARIABLES = ['{cliente}', '{fecha}', '{equipos}', '{dias}']

function vistaPrevia(plantilla, dias) {
    return plantilla
        .replaceAll('{cliente}', 'Juan Pérez')
        .replaceAll('{fecha}', '25/11/2026')
        .replaceAll('{equipos}', 'Parlante JBL 15 x2, Carpa 5x10 x1')
        .replaceAll('{dias}', String(dias || 0))
}

function Formulario({ inicial }) {
    const [tarifa, setTarifa] = useState(inicial.tarifaMoraDia != null ? String(Math.round(inicial.tarifaMoraDia)) : '')
    const [dias, setDias] = useState(inicial.diasAnticipacion != null ? String(inicial.diasAnticipacion) : '')
    const [plantilla, setPlantilla] = useState(inicial.plantillaEmail ?? '')
    const [guardando, setGuardando] = useState(false)
    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [resultado, setResultado] = useState(null)

    async function guardar() {
        setGuardando(true)
        setError('')
        setMensaje('')
        try {
            await guardarConfigAlquiler({
                tarifaMoraDia: tarifa === '' ? null : Number(tarifa),
                diasAnticipacion: dias === '' ? null : Number(dias),
                plantillaEmail: plantilla.trim() === '' ? null : plantilla,
            })
            setMensaje('Cambios guardados.')
        } catch (err) {
            setError(mensajeDeError(err, 'No se pudo guardar la configuración'))
        } finally {
            setGuardando(false)
        }
    }

    async function enviarAhora() {
        setEnviando(true)
        setError('')
        setResultado(null)
        try {
            const resp = await ejecutarRecordatorios()
            setResultado(resp.data)
        } catch (err) {
            setError(mensajeDeError(err, 'No se pudieron enviar los recordatorios'))
        } finally {
            setEnviando(false)
        }
    }

    return (
        <>
            <Fila
                titulo="Tarifa de mora por día"
                descripcion="Monto en ₲ que se cobra por cada día de atraso en la devolución. Si está vacío se usa un porcentaje del total de la orden."
            >
                <div className="sm:w-44">
                    <MontoInput value={tarifa} onChange={setTarifa} placeholder="5.000" />
                </div>
            </Fila>

            <Fila
                titulo="Días de anticipación para recordatorio"
                descripcion="Cuántos días antes de la devolución se le avisa al cliente por correo. Se envía solo, una vez por día."
            >
                <input
                    type="number"
                    min="0"
                    value={dias}
                    onChange={(e) => setDias(e.target.value)}
                    className={`${inputCls} sm:w-44`}
                    placeholder="2"
                />
            </Fila>

            <Fila
                titulo="Plantilla de mail"
                descripcion="Texto del recordatorio de devolución. Podés usar las variables de abajo; se reemplazan con los datos de cada orden."
                ancha
            >
                <div>
                    <textarea
                        value={plantilla}
                        onChange={(e) => setPlantilla(e.target.value)}
                        rows={7}
                        className={`${inputCls} resize-y leading-relaxed`}
                        placeholder="Hola {cliente}, te recordamos que la devolución de los equipos ({equipos}) es el {fecha}. ¡Gracias!"
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400">Insertar variable:</span>
                        {VARIABLES.map((v) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => setPlantilla((p) => `${p}${v}`)}
                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-2 py-1 font-mono"
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-1">Vista previa con datos de ejemplo</p>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap break-words">
                            {vistaPrevia(plantilla.trim() === '' ? 'Se usará la plantilla por defecto.' : plantilla, dias)}
                        </div>
                    </div>
                </div>
            </Fila>

            {error && <ErrorBanner mensaje={error} />}

            <div className="flex flex-wrap items-center gap-3">
                <BotonPrimario onClick={guardar} disabled={guardando}>
                    {guardando ? 'Guardando…' : 'Guardar cambios'}
                </BotonPrimario>
                <BotonSecundario onClick={enviarAhora} disabled={enviando}>
                    {enviando ? 'Enviando…' : 'Enviar recordatorios ahora'}
                </BotonSecundario>
                {mensaje && <span className="text-xs text-green-600">{mensaje}</span>}
            </div>

            {resultado && (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 text-sm rounded-lg px-4 py-3">
                    <p className="font-medium">
                        Devoluciones del {formatoFecha(resultado.fechaObjetivo)}: {resultado.ordenes}{' '}
                        {resultado.ordenes === 1 ? 'orden' : 'órdenes'}
                    </p>
                    <p className="text-xs mt-1">
                        Enviados: {resultado.enviados} · Simulados (sin SMTP): {resultado.simulados} · Sin email:{' '}
                        {resultado.sinEmail} · Errores: {resultado.errores}
                    </p>
                    {!resultado.smtpConfigurado && (
                        <p className="text-xs mt-1">
                            El servidor no tiene SMTP configurado: el correo se registra en el log en lugar de enviarse.
                        </p>
                    )}
                </div>
            )}
        </>
    )
}

export default function ConfigAlquiler() {
    const { datos, error, cargando, recargar } = useConsulta(() => obtenerConfigAlquiler(), [])
    return (
        <section className="space-y-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Alquiler y recordatorios</h2>
            {cargando && <Cargando />}
            {error && <ErrorBanner mensaje={error} onReintentar={recargar} />}
            {datos && <Formulario inicial={datos} />}
        </section>
    )
}
