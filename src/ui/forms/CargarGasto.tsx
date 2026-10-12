import React, { useState } from 'react';
import { Check, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { formatearMonto } from '../../core/whatsapp';
import { CategoriaGasto, GastoAporte, Persona } from '../../core/types';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Input } from '../components/Input';

export interface CargarGastoProps {
  personas: Persona[];
  onGuardar: (datos: {
    categoria: CategoriaGasto;
    monto_total: number;
    descripcion?: string;
    aportes: GastoAporte[];
    participantes_ids: string[];
  }) => { ok: true } | { ok: false; error: string };
  onCancelar: () => void;
}

interface FilaAporteState {
  id: string; // id temporal para la key de React
  persona_id: string;
  montoStr: string;
}

export const CargarGasto: React.FC<CargarGastoProps> = ({
  personas,
  onGuardar,
  onCancelar,
}) => {
  const [categoria, setCategoria] = useState<CategoriaGasto>('Asado');
  const [descripcion, setDescripcion] = useState('');

  // Filas dinámicas de aportes
  const [filasAportes, setFilasAportes] = useState<FilaAporteState[]>([
    {
      id: 'fila-1',
      persona_id: personas[0]?.id || '',
      montoStr: '',
    },
  ]);

  // Selección de participantes (todos seleccionados por defecto)
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState<string[]>(
    personas.map((p) => p.id)
  );

  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  // Categorías disponibles
  const categorias: CategoriaGasto[] = ['Asado', 'Fútbol', 'Bebidas', 'Otros'];

  // Suma en vivo de aportes
  const totalCalculado = filasAportes.reduce((acc, f) => {
    const val = parseInt(f.montoStr, 10);
    return acc + (isNaN(val) || val <= 0 ? 0 : val);
  }, 0);

  // Manejo de aportantes
  const handleAgregarAportante = () => {
    // Buscar si hay alguna persona que aún no esté en las filas para sugerirla
    const personasYaUsadas = new Set(filasAportes.map((f) => f.persona_id));
    const personaSugerida =
      personas.find((p) => !personasYaUsadas.has(p.id)) || personas[0];

    setFilasAportes([
      ...filasAportes,
      {
        id: `fila-${Date.now()}-${Math.random()}`,
        persona_id: personaSugerida?.id || '',
        montoStr: '',
      },
    ]);
  };

  const handleEliminarFila = (idFila: string) => {
    if (filasAportes.length <= 1) return;
    setFilasAportes(filasAportes.filter((f) => f.id !== idFila));
  };

  const handleCambiarPersonaFila = (idFila: string, personaId: string) => {
    setFilasAportes(
      filasAportes.map((f) => (f.id === idFila ? { ...f, persona_id: personaId } : f))
    );
  };

  const handleCambiarMontoFila = (idFila: string, valor: string) => {
    // Permitir solo dígitos numéricos
    const limpio = valor.replace(/\D/g, '');
    setFilasAportes(
      filasAportes.map((f) => (f.id === idFila ? { ...f, montoStr: limpio } : f))
    );
    if (errorGlobal) setErrorGlobal(null);
  };

  // Manejo de participantes
  const toggleParticipante = (personaId: string) => {
    if (participantesSeleccionados.includes(personaId)) {
      setParticipantesSeleccionados(
        participantesSeleccionados.filter((id) => id !== personaId)
      );
    } else {
      setParticipantesSeleccionados([...participantesSeleccionados, personaId]);
    }
    if (errorGlobal) setErrorGlobal(null);
  };

  const seleccionarTodos = () => {
    setParticipantesSeleccionados(personas.map((p) => p.id));
  };

  const seleccionarNinguno = () => {
    setParticipantesSeleccionados([]);
  };

  // Validación para habilitar el botón de guardar
  const esValido =
    totalCalculado > 0 &&
    participantesSeleccionados.length > 0 &&
    filasAportes.every((f) => {
      const m = parseInt(f.montoStr, 10);
      return !isNaN(m) && m > 0 && f.persona_id !== '';
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (totalCalculado <= 0) {
      setErrorGlobal('Cargá al menos un aporte mayor a $0.');
      return;
    }

    if (participantesSeleccionados.length === 0) {
      setErrorGlobal('Seleccioná al menos un participante para este gasto.');
      return;
    }

    const aportes: GastoAporte[] = filasAportes.map((f) => ({
      persona_id: f.persona_id,
      monto: parseInt(f.montoStr, 10),
    }));

    const res = onGuardar({
      categoria,
      monto_total: totalCalculado,
      descripcion: descripcion.trim() || undefined,
      aportes,
      participantes_ids: participantesSeleccionados,
    });

    if (!res.ok) {
      setErrorGlobal(res.error);
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
          onClick={onCancelar}
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
          aria-label="Cancelar carga de gasto"
        >
          <ChevronLeft size={20} />
          <span>Cancelar</span>
        </button>

        <h2 className="font-title" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>
          Cargar gasto
        </h2>

        <div style={{ width: '48px' }} />
      </header>

      {/* Contenido scrolleable del formulario */}
      <form
        onSubmit={handleSubmit}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 16px calc(80px + env(safe-area-inset-bottom, 16px)) 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Paso 1: Selección de categoría */}
        <div>
          <label
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: '10px',
            }}
          >
            Categoría
          </label>
          <div className="chips-scroll">
            {categorias.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                categoria={cat}
                active={categoria === cat}
                onClick={() => setCategoria(cat)}
              />
            ))}
          </div>
        </div>

        {/* Paso 2: Descripción opcional */}
        <Input
          label="Descripción (opcional)"
          placeholder="Ej: Costillar y vacío"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={80}
        />

        {/* Paso 3: Aportantes y Total Calculado */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              ¿Quién puso plata?
            </span>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total:</span>
              <span
                className="font-title tabular-nums"
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: 'var(--accent-coral)',
                }}
              >
                ${formatearMonto(totalCalculado)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filasAportes.map((fila, index) => (
              <div key={fila.id} className="aporte-row">
                {/* Selector nativo de persona */}
                <select
                  value={fila.persona_id}
                  onChange={(e) => handleCambiarPersonaFila(fila.id, e.target.value)}
                  style={{
                    flex: '1.4',
                    minHeight: '44px',
                    padding: '8px 10px',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.apodo} {p.es_organizador ? '(Org)' : ''}
                    </option>
                  ))}
                </select>

                {/* Input de monto con autofocus en la primera fila */}
                <div style={{ flex: '1', position: 'relative' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus={index === 0}
                    placeholder="Monto $"
                    value={fila.montoStr}
                    onChange={(e) => handleCambiarMontoFila(fila.id, e.target.value)}
                    style={{
                      minHeight: '44px',
                      padding: '8px 12px',
                      fontSize: '15px',
                      fontFamily: 'var(--font-title)',
                      textAlign: 'right',
                    }}
                  />
                </div>

                {/* Botón eliminar fila */}
                <button
                  type="button"
                  onClick={() => handleEliminarFila(fila.id)}
                  disabled={filasAportes.length <= 1}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '40px',
                    minHeight: '40px',
                    color: filasAportes.length > 1 ? 'var(--text-secondary)' : 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  aria-label="Eliminar aportante"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={handleAgregarAportante}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--accent-coral)',
                  padding: '8px 4px',
                  alignSelf: 'flex-start',
                }}
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>+ Agregar aportante</span>
              </button>

              {totalCalculado === 0 && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Cargá al menos un aporte
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Paso 4: Selección de Participantes */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Participantes
              </span>
              <span
                className="tabular-nums"
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}
              >
                {participantesSeleccionados.length} de {personas.length} participan
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={seleccionarTodos}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={seleccionarNinguno}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                Ninguno
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {personas.map((persona) => {
              const isChecked = participantesSeleccionados.includes(persona.id);
              return (
                <div
                  key={persona.id}
                  onClick={() => toggleParticipante(persona.id)}
                  className="fila-participante"
                  style={{
                    borderColor: isChecked ? 'rgba(224, 86, 56, 0.4)' : 'var(--border-subtle)',
                    backgroundColor: isChecked ? 'rgba(224, 86, 56, 0.08)' : 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: 'var(--radius-sm)',
                        border: '2px solid',
                        borderColor: isChecked ? 'var(--accent-coral)' : 'var(--text-muted)',
                        backgroundColor: isChecked ? 'var(--accent-coral)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                      }}
                    >
                      {isChecked && <Check size={14} strokeWidth={3} />}
                    </div>

                    <span
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {persona.apodo}
                    </span>
                  </div>

                  {persona.es_organizador && (
                    <span className="badge-organizador" style={{ fontSize: '11px' }}>
                      Org
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {participantesSeleccionados.length === 0 && (
            <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--accent-danger)' }}>
              Seleccioná al menos un participante
            </div>
          )}
        </div>

        {errorGlobal && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--accent-danger-bg)',
              color: 'var(--accent-danger)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {errorGlobal}
          </div>
        )}

        {/* Botón Guardar Gasto */}
        <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={!esValido}
          >
            Guardar gasto
          </Button>
        </div>
      </form>
    </div>
  );
};
