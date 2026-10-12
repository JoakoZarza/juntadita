import React, { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { useJuntada } from './hooks/useJuntada';
import { Button } from './ui/components/Button';
import { FAB } from './ui/components/FAB';
import { Header } from './ui/components/Header';
import { Modal } from './ui/components/Modal';
import { TabBar, TabId } from './ui/components/TabBar';
import { CargarGasto } from './ui/forms/CargarGasto';
import { CrearJuntada } from './ui/forms/CrearJuntada';
import { FutbolModulo } from './ui/modules/FutbolModulo';
import { TrucoModulo } from './ui/modules/TrucoModulo';
import { GastosView } from './ui/views/GastosView';
import { PersonasView } from './ui/views/PersonasView';
import { ResumenView } from './ui/views/ResumenView';

export const App: React.FC = () => {
  const {
    juntada,
    cargando,
    crearJuntada,
    agregarPersona,
    eliminarPersona,
    actualizarAliasPersona,
    agregarGasto,
    eliminarGasto,
    cerrarJuntada,
    reabrirJuntada,
    exportarJuntada,
    importarJuntada,
    agregarAnotado,
    eliminarAnotado,
    sortearEquipos,
    actualizarTruco,
    nuevaJuntada,
  } = useJuntada();

  const [activeTab, setActiveTab] = useState<TabId>('personas');
  const [modalNuevaAbierto, setModalNuevaAbierto] = useState(false);
  const [modalCargarGastoAbierto, setModalCargarGastoAbierto] = useState(false);
  const [moduloAbierto, setModuloAbierto] = useState<'futbol' | 'truco' | null>(null);

  // Registro PWA y detección de versión nueva
  const [hayNuevaVersion, setHayNuevaVersion] = useState(false);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    updateSWRef.current = registerSW({
      onNeedRefresh() {
        setHayNuevaVersion(true);
      },
      onOfflineReady() {
        // App lista para funcionar offline
      },
    });
  }, []);

  if (cargando) {
    return (
      <div
        className="app-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-title)',
          fontSize: '16px',
        }}
      >
        Iniciando Juntadita...
      </div>
    );
  }

  if (!juntada) {
    return (
      <div className="app-container">
        <CrearJuntada onSubmit={crearJuntada} onImportar={importarJuntada} />
      </div>
    );
  }

  const handleConfirmarNueva = () => {
    nuevaJuntada();
    setModalNuevaAbierto(false);
  };

  const handleFabClick = () => {
    if (activeTab === 'gastos') {
      setModalCargarGastoAbierto(true);
      return;
    }

    if (activeTab === 'personas') {
      const input = document.querySelector<HTMLInputElement>('input[placeholder="Apodo del pibe..."]');
      if (input) {
        input.focus();
      }
      return;
    }

    // Si está en otro tab, abrir carga de gasto
    setModalCargarGastoAbierto(true);
  };

  return (
    <div className="app-container">
      {/* Header fijo superior */}
      <Header
        juntada={juntada}
        onNuevaJuntada={() => setModalNuevaAbierto(true)}
        onAbrirModulo={(modulo) => setModuloAbierto(modulo)}
      />

      {/* Contenido principal scrolleable */}
      <main className="content-scroll">
        {activeTab === 'personas' && (
          <PersonasView
            juntada={juntada}
            onAgregarPersona={agregarPersona}
            onEliminarPersona={eliminarPersona}
            onActualizarAliasPersona={actualizarAliasPersona}
          />
        )}

        {activeTab === 'gastos' && (
          <GastosView
            juntada={juntada}
            onEliminarGasto={eliminarGasto}
            onCargarGasto={() => setModalCargarGastoAbierto(true)}
          />
        )}

        {activeTab === 'resumen' && (
          <ResumenView
            juntada={juntada}
            onCerrarJuntada={cerrarJuntada}
            onReabrirJuntada={reabrirJuntada}
            onExportarJuntada={exportarJuntada}
            onImportarJuntada={importarJuntada}
          />
        )}
      </main>

      {/* Botón flotante de acción (solo si la juntada está abierta) */}
      {juntada.estado === 'abierta' && (
        <FAB
          onClick={handleFabClick}
          ariaLabel={activeTab === 'gastos' ? 'Cargar gasto' : 'Sumar persona'}
        />
      )}

      {/* Barra de navegación inferior */}
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        personasCount={juntada.personas.length}
        gastosCount={juntada.gastos.length}
      />

      {/* Pantalla completa de carga de gasto */}
      {modalCargarGastoAbierto && (
        <CargarGasto
          personas={juntada.personas}
          onGuardar={(datos) => {
            const res = agregarGasto(datos);
            if (res.ok) {
              setModalCargarGastoAbierto(false);
            }
            return res;
          }}
          onCancelar={() => setModalCargarGastoAbierto(false)}
        />
      )}

      {/* Módulo opcional: Cancha de Fútbol */}
      {moduloAbierto === 'futbol' && (
        <FutbolModulo
          juntadaNombre={juntada.nombre}
          anotados={juntada.futbol?.anotados || []}
          onAgregarAnotado={agregarAnotado}
          onEliminarAnotado={eliminarAnotado}
          onSortearEquipos={sortearEquipos}
          onVolver={() => setModuloAbierto(null)}
        />
      )}

      {/* Módulo opcional: Anotador de Truco */}
      {moduloAbierto === 'truco' && (
        <TrucoModulo
          truco={juntada.truco}
          onActualizarTruco={actualizarTruco}
          onVolver={() => setModuloAbierto(null)}
        />
      )}

      {/* Modal de confirmación para Nueva Juntada */}
      <Modal
        isOpen={modalNuevaAbierto}
        onClose={() => setModalNuevaAbierto(false)}
        title="Nueva juntada"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalNuevaAbierto(false)}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmarNueva}>
              Iniciar nueva
            </Button>
          </>
        }
      >
        Tenés una juntada activa en este dispositivo. Si creás una nueva, se borrará la actual. ¿Querés continuar?
      </Modal>

      {/* Banner discreto de actualización PWA */}
      {hayNuevaVersion && (
        <aside
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '76px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: '448px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--accent-coral)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 90,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          }}
        >
          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
            Hay una versión nueva. Recargá para actualizar.
          </span>
          <button
            type="button"
            onClick={() => updateSWRef.current?.(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--accent-coral)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'var(--font-title)',
            }}
          >
            Recargar
          </button>
        </aside>
      )}
    </div>
  );
};

export default App;
