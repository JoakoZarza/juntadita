import React, { useEffect, useRef, useState } from 'react';
import { Flame } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';
import { useJuntada } from './hooks/useJuntada';
import { useToast } from './hooks/useToast';
import { Button } from './ui/components/Button';
import { FAB } from './ui/components/FAB';
import { Header } from './ui/components/Header';
import { InstallPrompt } from './ui/components/InstallPrompt';
import { Modal } from './ui/components/Modal';
import { TabBar, TabId } from './ui/components/TabBar';
import { Toast } from './ui/components/Toast';
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
    errorGuardado,
    crearJuntada,
    agregarPersona,
    eliminarPersona,
    actualizarAliasPersona,
    agregarGasto,
    eliminarGasto,
    restaurarGasto,
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
  const [gastoResaltadoId, setGastoResaltadoId] = useState<string | null>(null);
  const [pedidoFocoApodo, setPedidoFocoApodo] = useState(0);
  const { toast, mostrarToast, cerrarToast } = useToast();

  // El resaltado del gasto recién cargado dura lo mismo que su animación
  useEffect(() => {
    if (!gastoResaltadoId) return;
    const t = setTimeout(() => setGastoResaltadoId(null), 1600);
    return () => clearTimeout(t);
  }, [gastoResaltadoId]);

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
      <div className="app-container app-cargando" role="status" aria-label="Cargando Juntadita">
        <div className="splash-logo">
          <Flame size={32} />
        </div>
        <span className="font-title splash-nombre">Juntadita</span>
      </div>
    );
  }

  if (!juntada) {
    return (
      <div className="app-container">
        <CrearJuntada onSubmit={crearJuntada} onImportar={importarJuntada} />
        <InstallPrompt />
        <Toast toast={toast} onCerrar={cerrarToast} />
      </div>
    );
  }

  // Envuelve una acción que devuelve {ok, error} para confirmar o avisar con un toast
  const conToast =
    <A extends unknown[], R extends { ok: true } | { ok: false; error: string }>(
      accion: (...args: A) => R,
      mensajeExito: string | ((...args: A) => string)
    ) =>
    (...args: A): R => {
      const res = accion(...args);
      if (res.ok) {
        mostrarToast(typeof mensajeExito === 'function' ? mensajeExito(...args) : mensajeExito);
      } else {
        mostrarToast(res.error, 'error');
      }
      return res;
    };

  // Borrar sin confirmación previa: el toast ofrece deshacer
  const handleEliminarGasto = (gastoId: string) => {
    const indice = juntada.gastos.findIndex((g) => g.id === gastoId);
    const gasto = juntada.gastos[indice];
    const res = eliminarGasto(gastoId);
    if (res.ok && gasto) {
      mostrarToast('Gasto borrado', 'exito', {
        label: 'Deshacer',
        onClick: () => restaurarGasto(gasto, indice),
      });
    } else if (!res.ok) {
      mostrarToast(res.error, 'error');
    }
    return res;
  };

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
      setPedidoFocoApodo((n) => n + 1);
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
        onCopiarFallido={() =>
          mostrarToast('No se pudo copiar. Mantené apretado el alias para copiarlo.', 'error')
        }
      />

      {/* Aviso persistente si no se pudo guardar en el dispositivo */}
      {errorGuardado && (
        <aside role="alert" className="aviso-guardado">
          <span>
            {errorGuardado} Los últimos cambios pueden perderse si cerrás la app.
          </span>
          <Button
            variant="danger"
            onClick={() => {
              exportarJuntada();
              mostrarToast('Backup descargado');
            }}
          >
            Exportar backup
          </Button>
        </aside>
      )}

      {/* Contenido principal scrolleable */}
      <main className="content-scroll" key={activeTab}>
        {activeTab === 'personas' && (
          <PersonasView
            juntada={juntada}
            onAgregarPersona={(apodo, alias) => {
              // Los errores de validación ya se muestran debajo del input
              const res = agregarPersona(apodo, alias);
              if (res.ok) mostrarToast(`${apodo.trim()} se sumó`);
              return res;
            }}
            onEliminarPersona={conToast(eliminarPersona, 'Persona eliminada')}
            onActualizarAliasPersona={actualizarAliasPersona}
            pedidoFocoApodo={pedidoFocoApodo}
          />
        )}

        {activeTab === 'gastos' && (
          <GastosView
            juntada={juntada}
            onEliminarGasto={handleEliminarGasto}
            gastoResaltadoId={gastoResaltadoId}
            onCargarGasto={() => setModalCargarGastoAbierto(true)}
          />
        )}

        {activeTab === 'resumen' && (
          <ResumenView
            juntada={juntada}
            onCerrarJuntada={conToast(cerrarJuntada, 'Juntada cerrada. Cuentas congeladas.')}
            onReabrirJuntada={conToast(reabrirJuntada, 'Juntada reabierta')}
            onExportarJuntada={() => {
              exportarJuntada();
              mostrarToast('Backup descargado');
            }}
            onCopiarFallido={() =>
              mostrarToast('No se pudo copiar. Mantené apretado el mensaje para copiarlo.', 'error')
            }
            onCargarGasto={() => setModalCargarGastoAbierto(true)}
            onImportarJuntada={async (file) => {
              const res = await importarJuntada(file);
              if (res.ok) mostrarToast('Backup importado');
              return res;
            }}
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
              setActiveTab('gastos');
              setGastoResaltadoId(res.id);
              mostrarToast('Gasto guardado');
              // Confirmación háptica corta en celulares que la soportan
              navigator.vibrate?.(15);
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
          onCopiarFallido={() => mostrarToast('No se pudo copiar los equipos.', 'error')}
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
        <aside role="status" aria-live="polite" className="banner-flotante banner-actualizacion">
          <span className="text-sm c-primary fw-500">
            Hay una versión nueva. Recargá para actualizar.
          </span>
          <Button type="button" size="sm" onClick={() => updateSWRef.current?.(true)}>
            Recargar
          </Button>
        </aside>
      )}

      {/* Banner de instalación guiada de PWA */}
      <InstallPrompt />

      {/* Confirmaciones de acciones */}
      <Toast toast={toast} onCerrar={cerrarToast} />
    </div>
  );
};

export default App;
