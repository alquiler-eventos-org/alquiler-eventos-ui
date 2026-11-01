import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../context/useAuth'
import { ROLES, tieneRol } from '../api/sesion'
import Fila from '../components/config/Fila'
import ConfigAlquiler from '../components/config/ConfigAlquiler'
import Categorias from '../components/config/Categorias'
import LogoSistema from '../components/config/LogoSistema'

// ====== Configuraciones — según Figma "08 - Configuraciones" ======
// Cada rol ve solo lo que le corresponde (y el backend lo vuelve a controlar):
//  - ENCARGADO_DEPOSITO: tarifa de mora, días de anticipación y plantilla de mail.
//  - ENCARGADO_COMPRAS: categorías de equipos.
//  - ADMIN: todo, incluido el logotipo.

export default function Configuracion() {
    const { user } = useAuth()

    return (
        <AppLayout>
            {/* Encabezado blanco a ancho completo, como en el Figma */}
            <div className="-mx-6 -mt-6 mb-6 bg-white border-b border-gray-100 px-8 py-6">
                <h1 className="text-lg font-semibold text-gray-900">Configuraciones</h1>
            </div>

            <div className="max-w-3xl space-y-8">
                <section className="space-y-5">
                    <Fila
                        titulo="Sesión actual"
                        descripcion="Datos tomados del token JWT emitido por ms-seguridad"
                    >
                        <div className="text-sm text-gray-700 space-y-1">
                            <p>{user?.email}</p>
                            <p className="text-xs text-gray-500">Roles: {user?.roles?.join(', ')}</p>
                            <p className="text-xs text-gray-500">
                                El token vence:{' '}
                                {user?.exp ? new Date(user.exp * 1000).toLocaleTimeString('es-PY') : '—'}
                            </p>
                        </div>
                    </Fila>
                </section>

                {tieneRol(user, ROLES.alquiler) && <ConfigAlquiler />}
                {tieneRol(user, ROLES.compras) && <Categorias />}
                {tieneRol(user, ROLES.admin) && <LogoSistema />}
            </div>
        </AppLayout>
    )
}
