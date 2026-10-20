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

  const renderEquipo = (jugadores: FutbolAnotado[], nombre: string, equipo: 'a' | 'b') => (
    <div className={`equipo-card equipo-card-${equipo}`}>
      <div className="row-between">
        <span className={`font-title text-base fw-700 ${equipo === 'a' ? 'c-emerald' : 'c-blue'}`}>
          {nombre}
        </span>
        <span className="text-xs c-muted tabular-nums">({jugadores.length})</span>
      </div>

      <div className="stack gap-6">
        {jugadores.map((jugador, i) => (
          <div key={jugador.id} className="jugador-row">
            <span className="jugador-num">{i + 1}.</span>
            <span className="fw-600">{jugador.nombre}</span>
          </div>
        ))}
      </div>
    </div>
  );

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
          <Trophy size={18} color="var(--accent-coral)" />
          <h2 className="font-title subpage-title">Cancha</h2>
        </div>

        <div className="subpage-spacer" />
      </header>

      {/* Contenido scrolleable */}
      <div className="subpage-body">
        {/* Card de cupos con selector F5 / F7 / F11 */}
        <div className="cupo-card">
          <div className="stack gap-2">
            <span className="text-xs fw-600 c-secondary">Anotados</span>
            <div className="row-baseline gap-4">
              <span
                className={`monto text-xl ${anotados.length >= modalidad ? 'c-emerald' : 'c-primary'}`}
              >
                {anotados.length}
              </span>
              <span className="text-base c-muted tabular-nums">/{modalidad}</span>
            </div>
          </div>

          <div className="flex gap-6">
            {([10, 14, 22] as Modalidad[]).map((cant) => {
              const label = cant === 10 ? 'F5' : cant === 14 ? 'F7' : 'F11';
              return (
                <button
                  type="button"
                  key={cant}
                  onClick={() => setModalidad(cant)}
                  className={`modalidad-btn ${modalidad === cant ? 'is-active' : ''}`}
                >
                  {label} ({cant})
                </button>
              );
            })}
          </div>
        </div>

        {/* Input rápido para agregar anotado */}
        <form onSubmit={handleAgregar} className="stack gap-6">
          <div className="flex gap-8">
            <input
              type="text"
              placeholder="Nombre del pibe..."
              value={nombreInput}
              onChange={(e) => {
                setNombreInput(e.target.value);
                if (errorInput) setErrorInput(null);
              }}
              maxLength={30}
              className="input-anotado"
            />
            <Button
              type="submit"
              variant="primary"
              icon={<Plus size={18} />}
              className="futbol-sumar"
            >
              Sumar
            </Button>
          </div>

          {errorInput && <span className="text-xs c-danger">{errorInput}</span>}
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
          <div className="stack gap-14">
            <div className="equipos-grid">
              {renderEquipo(equipoA, 'Equipo A', 'a')}
              {renderEquipo(equipoB, 'Equipo B', 'b')}
            </div>

            {/* Acciones del sorteo */}
            <div className="flex gap-8">
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
                icon={copiado ? <Check size={16} /> : <Copy size={16} />}
                onClick={handleCopiarEquipos}
                className={copiado ? 'btn-exito' : ''}
              >
                {copiado ? 'Copiado' : 'Copiar equipos'}
              </Button>
            </div>
          </div>
        )}

        {/* Lista de todos los anotados */}
        <div className="stack gap-10">
          <span className="section-label">Lista general ({anotados.length})</span>

          {anotados.length === 0 ? (
            <div className="card card-vacia">
              <Users size={32} color="var(--text-muted)" strokeWidth={1.5} />
              <p className="text-sm">Nadie anotado todavía. Sumá al primer pibe.</p>
            </div>
          ) : (
            <div className="stack gap-8">
              {anotados.map((anotado, index) => {
                const ordenStr = (index + 1).toString().padStart(2, '0');
                return (
                  <div key={anotado.id} className="anotado-row">
                    <div className="row gap-10">
                      <span className="anotado-orden">{ordenStr}</span>
                      <div className="avatar-circle avatar-solo">
                        {anotado.nombre.charAt(0).toUpperCase()}
                      </div>
                      <span className="nombre">{anotado.nombre}</span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={<Trash2 size={16} />}
                      onClick={() => onEliminarAnotado(anotado.id)}
                      title="Eliminar anotado"
                      aria-label="Eliminar anotado"
                    />
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
