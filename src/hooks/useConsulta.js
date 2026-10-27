import { useEffect, useState } from 'react'
import { mensajeDeError } from '../api/client'

/**
 * Ejecuta una consulta a la API al montar y cada vez que cambian las
 * dependencias (pagina, filtro, etc.). Devuelve:
 *   { datos, error, cargando, recargar }
 * `consulta` debe devolver una promesa con forma de respuesta axios ({ data }).
 * Las dependencias tienen que ser valores simples (numeros, textos).
 */
export function useConsulta(consulta, dependencias = []) {
    const [recarga, setRecarga] = useState(0)
    const [estado, setEstado] = useState({ clave: null, datos: null, error: '' })
    const clave = JSON.stringify([...dependencias, recarga])

    useEffect(() => {
        let activo = true
        consulta()
            .then((resp) => {
                if (activo) setEstado({ clave, datos: resp.data, error: '' })
            })
            .catch((err) => {
                if (activo) setEstado({ clave, datos: null, error: mensajeDeError(err) })
            })
        return () => {
            activo = false
        }
        // `consulta` cambia en cada render; la clave ya resume lo que importa.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clave])

    // Mientras la clave guardada no sea la actual, la consulta sigue en curso.
    const vigente = estado.clave === clave
    return {
        datos: vigente ? estado.datos : null,
        error: vigente ? estado.error : '',
        cargando: !vigente,
        recargar: () => setRecarga((n) => n + 1),
    }
}
