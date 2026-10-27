// Descarga un CSV generado en el navegador (separador ";" para que Excel en
// español lo abra en columnas). `filas` es un arreglo de arreglos.
export function descargarCsv(nombreArchivo, filas) {
    const escapar = (valor) => `"${String(valor ?? '').replaceAll('"', '""')}"`
    const contenido = '﻿' + filas.map((fila) => fila.map(escapar).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }))
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = nombreArchivo
    enlace.click()
    URL.revokeObjectURL(url)
}
