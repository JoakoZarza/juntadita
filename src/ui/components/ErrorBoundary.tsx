import React from 'react';
import { STORAGE_KEY } from '../../core/storage';
import './ErrorBoundary.css';

interface ErrorBoundaryState {
  hayError: boolean;
}

/**
 * Pantalla de rescate ante un error de render: permite bajar los datos crudos
 * de la juntada antes de recargar, para que el usuario no pierda nada.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hayError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hayError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Error no controlado en la UI:', error, info.componentStack);
  }

  private descargarDatos = () => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      raw = null;
    }
    if (!raw) return;

    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `juntadita-rescate-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  render() {
    if (!this.state.hayError) return this.props.children;

    return (
      <div className="error-boundary" role="alert">
        <h1 className="font-title">Algo salió mal</h1>
        <p>
          La app tuvo un error inesperado. Tus datos siguen guardados en este dispositivo: bajá
          una copia por las dudas y después recargá.
        </p>
        <div className="error-boundary-acciones">
          <button type="button" className="error-boundary-secundario" onClick={this.descargarDatos}>
            Descargar mis datos
          </button>
          <button
            type="button"
            className="error-boundary-primario"
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
