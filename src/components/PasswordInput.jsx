import { useState } from 'react'
import { inputCls } from './UI'

// Campo de contraseña reutilizable: permite comprobar lo escrito sin dejarla
// visible por defecto.
export default function PasswordInput({ value, onChange, autoComplete = 'new-password', className = '' }) {
    const [visible, setVisible] = useState(false)

    return (
        <div className="relative">
            <input
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                className={`${inputCls} pr-11 ${className}`}
                autoComplete={autoComplete}
            />
            <button
                type="button"
                onClick={() => setVisible((actual) => !actual)}
                className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-blue-600"
                aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
                {visible ? '◉' : '👁'}
            </button>
        </div>
    )
}
