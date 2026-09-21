// Utilitarios de formato compartidos (no son componentes, por eso van acá).

// Formatea un número como Guaraníes: 350000 -> "₲ 350.000"
export function formatoGs(valor) {
    return `₲ ${Number(valor ?? 0).toLocaleString('es-PY')}`
}
