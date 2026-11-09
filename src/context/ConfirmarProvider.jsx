import { useCallback, useRef, useState } from 'react'
import { ConfirmarContext } from './confirmar-context'
import { BotonPrimario, BotonSecundario, Modal } from '../components/UI'

// Muestra una pantalla (modal de React) de confirmación en vez del alert/confirm
// nativo del navegador. Se monta una sola vez en App.jsx.
export function ConfirmarProvider({ children }) {
    const [estado, setEstado] = useState(null)
    const resolver = useRef(null)

    const confirmar = useCallback((mensaje, opciones = {}) => {
        return new Promise((resolve) => {
            resolver.current = resolve
            setEstado({
                mensaje,
                titulo: opciones.titulo ?? 'Confirmar acción',
                textoAceptar: opciones.textoAceptar ?? 'Aceptar',
            })
        })
    }, [])

    function cerrar(resultado) {
        resolver.current?.(resultado)
        resolver.current = null
        setEstado(null)
    }

    return (
        <ConfirmarContext.Provider value={confirmar}>
            {children}
            <Modal abierto={!!estado} titulo={estado?.titulo} onCerrar={() => cerrar(false)}>
                <p className="text-sm text-gray-700 mb-6">{estado?.mensaje}</p>
                <div className="flex justify-end gap-2">
                    <BotonSecundario type="button" onClick={() => cerrar(false)}>
                        Cancelar
                    </BotonSecundario>
                    <BotonPrimario type="button" onClick={() => cerrar(true)}>
                        {estado?.textoAceptar}
                    </BotonPrimario>
                </div>
            </Modal>
        </ConfirmarContext.Provider>
    )
}
