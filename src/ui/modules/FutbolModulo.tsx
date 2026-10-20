import React, { useState } from 'react';
import {
  Check,
  ChevronLeft,
  Copy,
  Plus,
  RotateCcw,
  Shuffle,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { FutbolAnotado } from '../../core/types';
import { Button } from '../components/Button';

export interface FutbolModuloProps {
  juntadaNombre: string;
  anotados: FutbolAnotado[];
  onAgregarAnotado: (nombre: string) => { ok: true } | { ok: false; error: string };
  onEliminarAnotado: (anotadoId: string) => void;
  onSortearEquipos: () => void;
  onVolver: () => void;
  onCopiarFallido?: () => void;
}

type Modalidad = 10 | 14 | 22;

export const FutbolModulo: React.FC<FutbolModuloProps> = ({
  juntadaNombre,
  anotados,
  onAgregarAnotado,
  onEliminarAnotado,
  onSortearEquipos,
  onVolver,
  onCopiarFallido,
}) => {
  const [nombreInput, setNombreInput] = useState('');
  const [modalidad, setModalidad] = useState<Modalidad>(10);
  const [errorInput, setErrorInput] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Equipos sorteados
  const equipoA = anotados.filter((a) => a.equipo === 'A');
  const equipoB = anotados.filter((a) => a.equipo === 'B');
  const hayEquiposSorteados = equipoA.length > 0 && equipoB.length > 0;

  const handleAgregar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreInput.trim()) {
      setErrorInput('Ingresá el nombre del pibe.');
      return;
    }

    const res = onAgregarAnotado(nombreInput);
    if (!res.ok) {
      setErrorInput(res.error);
    } else {
      setNombreInput('');
      setErrorInput(null);
    }
  };

  const handleCopiarEquipos = async () => {
    const lineasEquipoA = equipoA.map((a, i) => `${i + 1}. ${a.nombre}`).join('\n');
    const lineasEquipoB = equipoB.map((a, i) => `${i + 1}. ${a.nombre}`).join('\n');

    const texto = `⚽ FÚTBOL - ${juntadaNombre}

EQUIPO A:
${lineasEquipoA}

EQUIPO B:
${lineasEquipoB}`;

    let exito = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(texto);
        exito = true;
      } else {
        throw new Error('Fallback a execCommand');
      }
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        exito = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        exito = false;
      }
    }

    if (exito) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } else {
      onCopiarFallido?.();
    }
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
          <Trophy size={18} color="var(--accent-coral)" />
          <h2 className="font-title" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>
            Cancha
          </h2>
        </div>

        <div style={{ width: '48px' }} />
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
        {/* Card de cupos con selector F5 / F7 / F11 */}
        <div className="cupo-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Anotados
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span
                className="font-title tabular-nums"
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: anotados.length >= modalidad ? 'var(--accent-emerald)' : 'var(--text-primary)',
                }}
              >
                {anotados.length}
              </span>
              <span style={{ fontSize: '16px', color: 'var(--text-muted)' }} className="tabular-nums">
                /{modalidad}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {([10, 14, 22] as Modalidad[]).map((cant) => {
              const label = cant === 10 ? 'F5' : cant === 14 ? 'F7' : 'F11';
              const isSelected = modalidad === cant;
              return (
                <button
                  type="button"
                  key={cant}
                  onClick={() => setModalidad(cant)}
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-title)',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--accent-coral)' : 'var(--border-subtle)',
                    backgroundColor: isSelected ? 'var(--accent-coral)' : 'var(--bg-card)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                    minHeight: '36px',
                  }}
                >
                  {label} ({cant})
                </button>
              );
            })}
          </div>
        </div>

        {/* Input rápido para agregar anotado */}
        <form onSubmit={handleAgregar} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Nombre del pibe..."
              value={nombreInput}
              onChange={(e) => {
                setNombreInput(e.target.value);
                if (errorInput) setErrorInput(null);
              }}
              maxLength={30}
              style={{
                flex: 1,
                minHeight: '48px',
                fontSize: '15px',
              }}
            />
            <Button
              type="submit"
              variant="primary"
              icon={<Plus size={18} />}
              style={{ minWidth: '96px' }}
            >
              Sumar
            </Button>
          </div>

          {errorInput && (
            <span style={{ fontSize: '12px', color: 'var(--accent-danger)' }}>{errorInput}</span>
          )}
        </form>

        {/* Botón primario: Sortear equipos */}
        {anotados.length >= 2 && !hayEquiposSorteados && (
          <Button
            type="button"
            variant="primary"
            fullWidth
            icon={<Shuffle size={18} />}
            onClick={onSortearEquipos}
          >
            Sortear equipos
          </Button>
        )}

        {/* Equipos sorteados */}
        {hayEquiposSorteados && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Equipo A */}
              <div className="equipo-card equipo-card-a">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    className="font-title"
                    style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-emerald)' }}
                  >
                    Equipo A
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }} className="tabular-nums">
                    ({equipoA.length})
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {equipoA.map((jugador, i) => (
                    <div
                      key={jugador.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span
                        className="tabular-nums"
                        style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '16px' }}
                      >
                        {i + 1}.
                      </span>
                      <span style={{ fontWeight: 600 }}>{jugador.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipo B */}
              <div className="equipo-card equipo-card-b">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    className="font-title"
                    style={{ fontSize: '15px', fontWeight: 700, color: '#3B82F6' }}
                  >
                    Equipo B
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }} className="tabular-nums">
                    ({equipoB.length})
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {equipoB.map((jugador, i) => (
                    <div
                      key={jugador.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span
                        className="tabular-nums"
                        style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '16px' }}
                      >
                        {i + 1}.
                      </span>
                      <span style={{ fontWeight: 600 }}>{jugador.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Acciones del sorteo */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                icon={<RotateCcw size={16} />}
                onClick={onSortearEquipos}
              >
                Volver a sortear
              </Button>

              <Button
                type="button"
                variant="primary"
                fullWidth
                icon={copiado ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                onClick={handleCopiarEquipos}
                style={
                  copiado
                    ? {
                        backgroundColor: 'rgba(16, 185, 129, 0.18)',
                        borderColor: 'var(--accent-emerald)',
                        color: 'var(--accent-emerald)',
                      }
                    : undefined
                }
              >
                {copiado ? 'Copiado' : 'Copiar equipos'}
              </Button>
            </div>
          </div>
        )}

        {/* Lista de todos los anotados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Lista general ({anotados.length})
          </span>

          {anotados.length === 0 ? (
            <div
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '36px 16px',
                color: 'var(--text-secondary)',
                gap: '8px',
              }}
            >
              <Users size={32} color="var(--text-muted)" strokeWidth={1.5} />
              <p style={{ fontSize: '14px' }}>Nadie anotado todavía. Sumá al primer pibe.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {anotados.map((anotado, index) => {
                const ordenStr = (index + 1).toString().padStart(2, '0');
                return (
                  <div key={anotado.id} className="anotado-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        className="font-title tabular-nums"
                        style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '18px' }}
                      >
                        {ordenStr}
                      </span>
                      <div className="avatar-circle" style={{ margin: 0 }}>
                        {anotado.nombre.charAt(0).toUpperCase()}
                      </div>
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {anotado.nombre}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onEliminarAnotado(anotado.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        minHeight: '36px',
                        minWidth: '36px',
                      }}
                      title="Eliminar anotado"
                      aria-label="Eliminar anotado"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
