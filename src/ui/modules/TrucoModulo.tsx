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
          style={{
            filter: 'drop-shadow(0 0 2px rgba(245, 166, 35, 0.4))',
          }}
        >
          {/* Línea 1: Arriba */}
          {puntos >= 1 && (
            <line
              x1="8"
              y1="8"
              x2="36"
              y2="8"
              stroke="#F5A623"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          )}

          {/* Línea 2: Derecha */}
          {puntos >= 2 && (
            <line
              x1="36"
              y1="8"
              x2="36"
              y2="36"
              stroke="#F5A623"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          )}

          {/* Línea 3: Abajo */}
          {puntos >= 3 && (
            <line
              x1="36"
              y1="36"
              x2="8"
              y2="36"
              stroke="#F5A623"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          )}

          {/* Línea 4: Izquierda */}
          {puntos >= 4 && (
            <line
              x1="8"
              y1="36"
              x2="8"
              y2="8"
              stroke="#F5A623"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          )}

          {/* Línea 5: Diagonal */}
          {puntos >= 5 && (
            <line
              x1="8"
              y1="8"
              x2="36"
              y2="36"
              stroke="#F5A623"
              strokeWidth="3.2"
              strokeLinecap="round"
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

  return (
    <div className="fullscreen-form">
      {/* Header fijo */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          minHeight: '60px',
        }}
      >
        <button
          type="button"
          onClick={onVolver}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--text-secondary)',
            fontSize: '15px',
            fontWeight: 600,
            padding: '6px 8px',
            borderRadius: 'var(--radius-sm)',
          }}
          aria-label="Volver"
        >
          <ChevronLeft size={20} />
          <span>Volver</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Spade size={18} color="var(--accent-coral)" />
          <h2 className="font-title" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>
            Anotador de Truco
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setModalReiniciarAbierto(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            minHeight: '36px',
            minWidth: '36px',
          }}
          title="Reiniciar marcador"
          aria-label="Reiniciar marcador"
        >
          <RotateCcw size={18} />
        </button>
      </header>

      {/* Contenido scrolleable */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px calc(40px + env(safe-area-inset-bottom, 16px)) 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Toggle límite: a 15 / a 30 */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '4px',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => handleCambiarLimite(15)}
              style={{
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-title)',
                padding: '6px 18px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: limite === 15 ? 'var(--accent-coral)' : 'transparent',
                color: limite === 15 ? '#FFFFFF' : 'var(--text-secondary)',
                minHeight: '34px',
              }}
            >
              a 15
            </button>
            <button
              type="button"
              onClick={() => handleCambiarLimite(30)}
              style={{
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-title)',
                padding: '6px 18px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: limite === 30 ? 'var(--accent-coral)' : 'transparent',
                color: limite === 30 ? '#FFFFFF' : 'var(--text-secondary)',
                minHeight: '34px',
              }}
            >
              a 30
            </button>
          </div>
        </div>

        {/* Banner de ganador */}
        {hayGanador && (
          <div
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px',
              backgroundColor:
                ganador === 'NOSOTROS'
                  ? 'rgba(224, 86, 56, 0.15)'
                  : 'rgba(59, 130, 246, 0.15)',
              borderColor:
                ganador === 'NOSOTROS' ? 'var(--accent-coral)' : '#3B82F6',
              color: ganador === 'NOSOTROS' ? 'var(--accent-coral)' : '#60A5FA',
            }}
          >
            <Trophy size={20} />
            <span className="font-title" style={{ fontSize: '16px', fontWeight: 700 }}>
              ¡Ganaron {ganador}!
            </span>
          </div>
        )}

        {/* Marcador central con dos columnas */}
        <div className="truco-marcador">
          {/* Columna NOSOTROS */}
          <div className="marcador-col">
            <span
              className="font-title"
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--accent-coral)',
                letterSpacing: '0.04em',
              }}
            >
              NOSOTROS
            </span>

            <span
              className="font-title tabular-nums"
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              {nosotros}
            </span>

            {/* Grilla de fósforos */}
            <div className="fosforos-grid">
              {Array.from({ length: totalCuadros }).map((_, idx) => (
                <CuadroFosforo
                  key={idx}
                  puntos={getPuntosCuadro(nosotros, idx)}
                />
              ))}
            </div>

            {/* Botones de acción NOSOTROS */}
            <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleSumarNosotros}
                disabled={hayGanador}
                style={{
                  flex: 1.4,
                  minHeight: '48px',
                  backgroundColor: 'var(--accent-coral)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '18px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-title)',
                  opacity: hayGanador ? 0.4 : 1,
                }}
                aria-label="Sumar punto a Nosotros"
              >
                +1
              </button>

              <button
                type="button"
                onClick={handleRestarNosotros}
                disabled={nosotros === 0}
                style={{
                  flex: 1,
                  minHeight: '48px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '16px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-title)',
                  opacity: nosotros === 0 ? 0.4 : 1,
                }}
                aria-label="Restar punto a Nosotros"
              >
                -1
              </button>
            </div>
          </div>

          {/* Columna ELLOS */}
          <div className="marcador-col">
            <span
              className="font-title"
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#60A5FA',
                letterSpacing: '0.04em',
              }}
            >
              ELLOS
            </span>

            <span
              className="font-title tabular-nums"
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              {ellos}
            </span>

            {/* Grilla de fósforos */}
            <div className="fosforos-grid">
              {Array.from({ length: totalCuadros }).map((_, idx) => (
                <CuadroFosforo
                  key={idx}
                  puntos={getPuntosCuadro(ellos, idx)}
                />
              ))}
            </div>

            {/* Botones de acción ELLOS */}
            <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleSumarEllos}
                disabled={hayGanador}
                style={{
                  flex: 1.4,
                  minHeight: '48px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '18px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-title)',
                  opacity: hayGanador ? 0.4 : 1,
                }}
                aria-label="Sumar punto a Ellos"
              >
                +1
              </button>

              <button
                type="button"
                onClick={handleRestarEllos}
                disabled={ellos === 0}
                style={{
                  flex: 1,
                  minHeight: '48px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '16px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-title)',
                  opacity: ellos === 0 ? 0.4 : 1,
                }}
                aria-label="Restar punto a Ellos"
              >
                -1
              </button>
            </div>
          </div>
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
