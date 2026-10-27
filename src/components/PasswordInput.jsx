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
                {visible ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.1 0 8.7 4.1 9.7 6.1a1.9 1.9 0 0 1 0 1.8 12.5 12.5 0 0 1-3.2 3.9" />
                        <path d="M6.1 6.1A12.4 12.4 0 0 0 2.3 10a1.9 1.9 0 0 0 0 1.8C3.3 13.9 6.9 18 12 18c.8 0 1.6-.1 2.3-.3" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                        <path d="M2.3 12S5.8 5 12 5s9.7 7 9.7 7-3.5 7-9.7 7S2.3 12 2.3 12z" />
                        <circle cx="12" cy="12" r="2.7" />
                    </svg>
                )}
            </button>
        </div>
    )
}
