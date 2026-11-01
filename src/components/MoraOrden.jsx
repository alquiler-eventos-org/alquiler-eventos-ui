import { obtenerMora } from '../api/ordenesAlquiler'
import { useConsulta } from '../hooks/useConsulta'
import { formatoGs } from '../utils/formato'

// Mora de una orden de alquiler con la tarifa por día que se configuró.
// Se muestra solo cuando hay mora (atraso en la devolución).
export default function MoraOrden({ orden }) {
    const { datos } = useConsulta(() => obtenerMora(orden.id), [orden.id, orden.estado])
    if (!datos || datos.montoMora == null) return null

    const estimada = datos.origen === 'ESTIMADA'
    return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm">
            <p className="font-medium text-amber-900">
                Mora: {formatoGs(datos.montoMora)}
                {estimada && ' (estimada a hoy)'}
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
                {estimada
                    ? `${datos.diasAtraso} ${datos.diasAtraso === 1 ? 'día' : 'días'} de atraso`
                    : 'Monto registrado al cambiar el estado de la orden'}
                {datos.tarifaDia != null
                    ? ` · tarifa configurada: ${formatoGs(datos.tarifaDia)} por día`
                    : ' · sin tarifa por día configurada (se usa un porcentaje del total)'}
            </p>
        </div>
    )
}
