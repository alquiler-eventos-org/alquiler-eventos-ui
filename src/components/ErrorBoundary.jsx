import { Component } from 'react'
import { ErrorServidor } from '../pages/Errores'

// Atrapa errores de render para mostrar la página 500 en lugar de una pantalla en blanco.
export default class ErrorBoundary extends Component {
    state = { fallo: false }

    static getDerivedStateFromError() {
        return { fallo: true }
    }

    componentDidCatch(error) {
        console.error('Error de la interfaz:', error)
    }

    render() {
        if (this.state.fallo) {
            return <ErrorServidor onReintentar={() => window.location.assign('/')} />
        }
        return this.props.children
    }
}
