import { inputCls } from './UI'
import { formatoMontoEntrada, normalizarMontoEntrada } from '../utils/formato'

// Los montos se guardan sin separadores para la API, pero se muestran con
// puntos de miles mientras se cargan (5000 -> 5.000).
export default function MontoInput({ value, onChange, className = '', ...props }) {
    return (
        <input
            {...props}
            type="text"
            inputMode="numeric"
            value={formatoMontoEntrada(value)}
            onChange={(e) => onChange(normalizarMontoEntrada(e.target.value))}
            className={`${inputCls} text-right ${className}`}
        />
    )
}
