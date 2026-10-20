import React, { useState } from 'react';
import { ChevronLeft, RotateCcw, Spade, Trophy } from 'lucide-react';
import { TrucoPartida } from '../../core/types';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

export interface TrucoModuloProps {
  truco?: TrucoPartida;
  onActualizarTruco: (parcial: Partial<TrucoPartida>) => void;
  onVolver: () => void;
}

interface CuadroFosforoProps {
  puntos: number; // 0 a 5
}

const CuadroFosforo: React.FC<CuadroFosforoProps> = ({ puntos }) => {
  const esCompleto = puntos >= 5;
  const esVacio = puntos === 0;

  let claseContenedor = 'fosforo-box fosforo-parcial';
  if (esCompleto) claseContenedor = 'fosforo-box fosforo-completo';
  if (esVacio) claseContenedor = 'fosforo-box fosforo-vacio';

  return (
    <div className={claseContenedor}>
      {!esVacio && (
        <svg
          width="44"
          height="44"
          viewBox="0 0 44 44"
          className="fosforo-svg"
        >
          {/* Línea 1: Arriba */}
          {puntos >= 1 && (
            <line
              x1="8"
              y1="8"
              x2="36"
              y2="8"
              className="fosforo-linea"
            />
          )}

          {/* Línea 2: Derecha */}
          {puntos >= 2 && (
            <line
              x1="36"
              y1="8"
              x2="36"
              y2="36"
              className="fosforo-linea"
            />
          )}

          {/* Línea 3: Abajo */}
          {puntos >= 3 && (
            <line
              x1="36"
              y1="36"
              x2="8"
              y2="36"
              className="fosforo-linea"
            />
          )}

          {/* Línea 4: Izquierda */}
          {puntos >= 4 && (
            <line
              x1="8"
              y1="36"
              x2="8"
              y2="8"
              className="fosforo-linea"
            />
          )}

          {/* Línea 5: Diagonal */}
          {puntos >= 5 && (
            <line
              x1="8"
              y1="8"
              x2="36"
              y2="36"
              className="fosforo-linea"
            />
          )}
        </svg>
      )}
    </div>
  );
};

export const TrucoModulo: React.FC<TrucoModuloProps> = ({
  truco = { puntos_nosotros: 0, puntos_ellos: 0, limite: 30 },
  onActualizarTruco,
  onVolver,
}) => {
  const [modalReiniciarAbierto, setModalReiniciarAbierto] = useState(false);

  const limite = truco.limite;
  const nosotros = truco.puntos_nosotros;
  const ellos = truco.puntos_ellos;

  const hayGanador = nosotros >= limite || ellos >= limite;
  const ganador = nosotros >= limite ? 'NOSOTROS' : ellos >= limite ? 'ELLOS' : null;

  const handleCambiarLimite = (nuevoLimite: 15 | 30) => {
    onActualizarTruco({ limite: nuevoLimite });
  };

  const handleSumarNosotros = () => {
    if (hayGanador) return;
    onActualizarTruco({ puntos_nosotros: nosotros + 1 });
  };

  const handleRestarNosotros = () => {
    onActualizarTruco({ puntos_nosotros: Math.max(0, nosotros - 1) });
  };

  const handleSumarEllos = () => {
    if (hayGanador) return;
    onActualizarTruco({ puntos_ellos: ellos + 1 });
  };

  const handleRestarEllos = () => {
    onActualizarTruco({ puntos_ellos: Math.max(0, ellos - 1) });
  };

  const handleConfirmarReinicio = () => {
    onActualizarTruco({ puntos_nosotros: 0, puntos_ellos: 0 });
    setModalReiniciarAbierto(false);
  };

  // Cuadros de fósforos (3 o 6 cuadros)
  const totalCuadros = limite === 15 ? 3 : 6;

  const getPuntosCuadro = (puntosTotales: number, cuadroIndex: number) => {
    const restante = puntosTotales - cuadroIndex * 5;
    return Math.max(0, Math.min(5, restante));
  };

  const renderColumna = (equipo: 'nosotros' | 'ellos') => {
    const esNosotros = equipo === 'nosotros';
    const puntos = esNosotros ? nosotros : ellos;
    const nombre = esNosotros ? 'Nosotros' : 'Ellos';

    return (
      <div className="marcador-col">
        <span className={`marcador-equipo ${esNosotros ? 'c-coral' : 'c-blue-light'}`}>
          {nombre.toUpperCase()}
        </span>

        <span className="monto marcador-puntos">{puntos}</span>

        {/* Grilla de fósforos */}
        <div className="fosforos-grid">
          {Array.from({ length: totalCuadros }).map((_, idx) => (
            <CuadroFosforo key={idx} puntos={getPuntosCuadro(puntos, idx)} />
          ))}
        </div>

        {/* Botones de acción */}
        <div className="marcador-acciones">
          <button
            type="button"
            onClick={esNosotros ? handleSumarNosotros : handleSumarEllos}
            disabled={hayGanador}
            className={`truco-sumar ${esNosotros ? '' : 'truco-sumar-ellos'}`}
            aria-label={`Sumar punto a ${nombre}`}
          >
            +1
          </button>

          <button
            type="button"
            onClick={esNosotros ? handleRestarNosotros : handleRestarEllos}
            disabled={puntos === 0}
            className="truco-restar"
            aria-label={`Restar punto a ${nombre}`}
          >
            -1
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fullscreen-form">
      {/* Header fijo */}
      <header className="subpage-header">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ChevronLeft size={20} />}
          onClick={onVolver}
          aria-label="Volver"
        >
          Volver
        </Button>

        <div className="row gap-8">
          <Spade size={18} color="var(--accent-coral)" />
          <h2 className="font-title subpage-title">Anotador de Truco</h2>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          icon={<RotateCcw size={18} />}
          onClick={() => setModalReiniciarAbierto(true)}
          title="Reiniciar marcador"
          aria-label="Reiniciar marcador"
        />
      </header>

      {/* Contenido scrolleable */}
      <div className="subpage-body">
        {/* Toggle límite: a 15 / a 30 */}
        <div className="flex justify-center">
          <div className="segmented">
            {([15, 30] as const).map((opcion) => (
              <button
                key={opcion}
                type="button"
                onClick={() => handleCambiarLimite(opcion)}
                className={`segmented-opcion ${limite === opcion ? 'is-active' : ''}`}
              >
                a {opcion}
              </button>
            ))}
          </div>
        </div>

        {/* Banner de ganador */}
        {hayGanador && (
          <div className={`card truco-ganador ${ganador === 'ELLOS' ? 'truco-ganador-ellos' : ''}`}>
            <Trophy size={20} />
            <span className="font-title text-base fw-700">¡Ganaron {ganador}!</span>
          </div>
        )}

        {/* Marcador central con dos columnas */}
        <div className="truco-marcador">
          {renderColumna('nosotros')}
          {renderColumna('ellos')}
        </div>
      </div>

      {/* Modal de reinicio */}
      <Modal
        isOpen={modalReiniciarAbierto}
        onClose={() => setModalReiniciarAbierto(false)}
        title="¿Reiniciar el marcador a 0-0?"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalReiniciarAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmarReinicio}
            >
              Reiniciar
            </Button>
          </>
        }
      >
        Se van a borrar los puntos actuales de la partida.
      </Modal>
    </div>
  );
};
