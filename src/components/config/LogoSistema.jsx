import { useState } from 'react'
import Fila from './Fila'
import { BotonPrimario, BotonSecundario } from '../UI'
import { mensajeDeError } from '../../api/client'
import { borrarLogo, guardarLogo } from '../../api/configuracion'
import { guardarLogoLocal, useLogo } from '../../utils/logo'

// Logotipo del sistema: solo lo cambia el administrador. Se reduce a 256 px en el
// navegador antes de subirlo, así siempre entra en el servidor y carga rápido.

const MAX_LADO = 256
const MAX_ARCHIVO = 5 * 1024 * 1024

function reducirImagen(archivo) {
    return new Promise((resolver, rechazar) => {
        const url = URL.createObjectURL(archivo)
        const img = new Image()
        img.onload = () => {
            const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height))
            const lienzo = document.createElement('canvas')
            lienzo.width = Math.max(1, Math.round(img.width * escala))
            lienzo.height = Math.max(1, Math.round(img.height * escala))
            lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height)
            URL.revokeObjectURL(url)
            resolver(lienzo.toDataURL('image/png'))
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            rechazar(new Error('No se pudo leer la imagen'))
        }
        img.src = url
    })
}

export default function LogoSistema() {
    const actual = useLogo()
    const [nuevo, setNuevo] = useState(null) // data URL a la espera de guardar
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [ocupado, setOcupado] = useState(false)

    async function elegir(e) {
        const archivo = e.target.files?.[0]
        e.target.value = ''
        if (!archivo) return
        setError('')
        setMensaje('')
        if (!archivo.type.startsWith('image/')) {
            setError('El archivo tiene que ser una imagen (PNG, JPG, SVG…).')
            return
        }
        if (archivo.size > MAX_ARCHIVO) {
            setError('La imagen pesa más de 5 MB.')
            return
        }
        try {
            setNuevo(await reducirImagen(archivo))
        } catch (err) {
            setError(err.message)
        }
    }

    async function guardar() {
        setOcupado(true)
        setError('')
        try {
            const resp = await guardarLogo(nuevo)
            guardarLogoLocal(resp.data?.logo ?? nuevo)
            setNuevo(null)
            setMensaje('Logotipo actualizado.')
        } catch (err) {
            setError(mensajeDeError(err, 'No se pudo guardar el logotipo'))
        } finally {
            setOcupado(false)
        }
    }

    async function quitar() {
        if (!window.confirm('¿Quitar el logotipo del sistema?')) return
        setOcupado(true)
        setError('')
        try {
            await borrarLogo()
            guardarLogoLocal(null)
            setMensaje('Logotipo quitado.')
        } catch (err) {
            setError(mensajeDeError(err, 'No se pudo quitar el logotipo'))
        } finally {
            setOcupado(false)
        }
    }

    const mostrado = nuevo ?? actual

    return (
        <section className="space-y-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Apariencia (solo administrador)</h2>
            <Fila
                titulo="Logotipo del sistema"
                descripcion="Se muestra en el login y en el menú lateral. Se reduce automáticamente a 256 px."
            >
                <div className="flex flex-wrap items-center gap-3 sm:justify-self-end">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden text-[10px] text-gray-400">
                        {mostrado ? (
                            <img src={mostrado} alt="Logotipo" className="max-w-full max-h-full object-contain" />
                        ) : (
                            'Sin logo'
                        )}
                    </div>
                    <label className="cursor-pointer bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg transition">
                        ↑ Elegir imagen
                        <input type="file" accept="image/*" onChange={elegir} className="hidden" />
                    </label>
                    {nuevo && (
                        <>
                            <BotonPrimario onClick={guardar} disabled={ocupado}>
                                {ocupado ? 'Guardando…' : 'Guardar logo'}
                            </BotonPrimario>
                            <BotonSecundario onClick={() => setNuevo(null)}>Cancelar</BotonSecundario>
                        </>
                    )}
                    {!nuevo && actual && (
                        <BotonSecundario onClick={quitar} disabled={ocupado}>
                            Quitar logo
                        </BotonSecundario>
                    )}
                </div>
            </Fila>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            {mensaje && <p className="text-green-600 text-xs">{mensaje}</p>}
        </section>
    )
}
