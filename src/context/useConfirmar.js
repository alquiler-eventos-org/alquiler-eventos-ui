import { useContext } from 'react'
import { ConfirmarContext } from './confirmar-context'

// Uso: const confirmar = useConfirmar()
//      if (!(await confirmar('¿Eliminar?'))) return
// Devuelve una promesa que resuelve true (Aceptar) o false (Cancelar).
export function useConfirmar() {
    return useContext(ConfirmarContext)
}
