import React, { useState } from 'react';
import { Check, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { formatearMonto } from '../../core/whatsapp';
import { CategoriaGasto, GastoAporte, Persona } from '../../core/types';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';

// Hasta $999.999.999: evita montos absurdos que rompen el layout o pierden precisión
const MAX_DIGITOS_MONTO = 9;

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
  // Los faltantes se muestran en rojo recién después del primer intento de guardar
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [confirmarDescarte, setConfirmarDescarte] = useState(false);

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
    // Solo dígitos (los puntos de miles se agregan al mostrar), sin ceros a la izquierda
    const limpio = valor.replace(/\D/g, '').replace(/^0+/, '').slice(0, MAX_DIGITOS_MONTO);
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

  // Si ya cargó algo, no descartarlo sin preguntar
  const formularioSucio =
    descripcion.trim() !== '' || filasAportes.some((f) => f.montoStr !== '');

  const handleCancelar = () => {
    if (formularioSucio) {
      setConfirmarDescarte(true);
    } else {
      onCancelar();
    }
  };

  const seleccionarTodos = () => {
    setParticipantesSeleccionados(personas.map((p) => p.id));
  };

  const seleccionarNinguno = () => {
    setParticipantesSeleccionados([]);
  };

  // Personas que aparecen en más de una fila de aportes
  const conteoAportantes = new Map<string, number>();
  filasAportes.forEach((f) =>
    conteoAportantes.set(f.persona_id, (conteoAportantes.get(f.persona_id) || 0) + 1)
  );
  const idsDuplicados = new Set(
    [...conteoAportantes].filter(([, n]) => n > 1).map(([id]) => id)
  );

  // Lo que falta para poder guardar, en lenguaje del usuario
  const faltantes: string[] = [];
  if (totalCalculado === 0) {
    faltantes.push('Cargá cuánto puso al menos una persona.');
  } else if (
    filasAportes.some((f) => {
      const m = parseInt(f.montoStr, 10);
      return isNaN(m) || m <= 0;
    })
  ) {
    faltantes.push('Completá el monto de cada aportante o borrá la fila vacía.');
  }
  idsDuplicados.forEach((id) => {
    const apodo = personas.find((p) => p.id === id)?.apodo || 'Alguien';
    faltantes.push(`${apodo} aparece dos veces en "¿Quién puso plata?". Sumá los montos en una sola fila.`);
  });
  if (participantesSeleccionados.length === 0) {
    faltantes.push('Elegí al menos un participante.');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (faltantes.length > 0) {
      setIntentoGuardar(true);
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
      <header className="subpage-header">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ChevronLeft size={20} />}
          onClick={handleCancelar}
          aria-label="Cancelar carga de gasto"
        >
          Cancelar
        </Button>

        <h2 className="font-title subpage-title">Cargar gasto</h2>

        <div className="subpage-spacer" />
      </header>

      {/* Contenido scrolleable del formulario */}
      <form onSubmit={handleSubmit} className="subpage-body form-gasto">
        {/* Paso 1: Selección de categoría */}
        <div>
          <p id="label-categoria" className="field-label mb-10">
            Categoría
          </p>
          <div className="chips-scroll" role="group" aria-labelledby="label-categoria">
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
          <div className="row-between mb-12">
            <span className="section-label">¿Quién puso plata?</span>

            <div className="row-baseline gap-6">
              <span className="text-xs c-muted">Total:</span>
              <span className="monto text-xl c-coral">${formatearMonto(totalCalculado)}</span>
            </div>
          </div>

          <div className="stack gap-10">
            {filasAportes.map((fila, index) => (
              <div key={fila.id} className="aporte-row">
                {/* Selector nativo de persona */}
                <select
                  value={fila.persona_id}
                  onChange={(e) => handleCambiarPersonaFila(fila.id, e.target.value)}
                  aria-label="Quién puso plata"
                  aria-invalid={idsDuplicados.has(fila.persona_id)}
                  className={`aporte-select ${idsDuplicados.has(fila.persona_id) ? 'has-error' : ''}`}
                >
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.apodo} {p.es_organizador ? '(organizador)' : ''}
                    </option>
                  ))}
                </select>

                {/* Input de monto con autofocus en la primera fila */}
                <div className="aporte-monto">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus={index === 0}
                    placeholder="Monto $"
                    aria-label="Monto aportado"
                    value={fila.montoStr ? formatearMonto(parseInt(fila.montoStr, 10)) : ''}
                    onChange={(e) => handleCambiarMontoFila(fila.id, e.target.value)}
                  />
                </div>

                {/* Botón eliminar fila */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon={<Trash2 size={18} />}
                  onClick={() => handleEliminarFila(fila.id)}
                  disabled={filasAportes.length <= 1}
                  aria-label="Eliminar aportante"
                />
              </div>
            ))}

            <div className="row-between">
              <Button
                type="button"
                variant="link"
                size="sm"
                icon={<Plus size={16} strokeWidth={2.5} />}
                onClick={handleAgregarAportante}
                disabled={filasAportes.length >= personas.length}
              >
                Agregar aportante
              </Button>

              {totalCalculado === 0 && (
                <span className="text-xs c-muted">Cargá al menos un aporte</span>
              )}
            </div>
          </div>
        </div>

        {/* Paso 4: Selección de Participantes */}
        <div>
          <div className="row-between mb-10">
            <div className="row-baseline gap-8">
              <span className="section-label">Participantes</span>
              <span className="tabular-nums text-xs fw-600 c-muted">
                {participantesSeleccionados.length} de {personas.length} participan
              </span>
            </div>

            <div className="flex gap-8">
              <Button type="button" variant="outline" size="sm" onClick={seleccionarTodos}>
                Todos
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={seleccionarNinguno}>
                Ninguno
              </Button>
            </div>
          </div>

          <div className="stack gap-8" role="group" aria-label="Participantes del gasto">
            {personas.map((persona) => {
              const isChecked = participantesSeleccionados.includes(persona.id);
              return (
                <button
                  type="button"
                  key={persona.id}
                  role="checkbox"
                  aria-checked={isChecked}
                  onClick={() => toggleParticipante(persona.id)}
                  className={`fila-participante ${isChecked ? 'is-checked' : ''}`}
                >
                  <span className="row gap-10">
                    <span className="check-box" aria-hidden="true">
                      {isChecked && <Check size={14} strokeWidth={3} />}
                    </span>

                    <span className="fila-participante-nombre">{persona.apodo}</span>
                  </span>

                  {persona.es_organizador && (
                    <span className="badge-organizador">Organizador</span>
                  )}
                </button>
              );
            })}
          </div>

          {participantesSeleccionados.length === 0 && (
            <div className="mt-6 text-xs c-danger">Seleccioná al menos un participante</div>
          )}
        </div>

        {errorGlobal && <div className="error-box text-sm fw-500">{errorGlobal}</div>}

        {/* Botón Guardar Gasto: siempre habilitado, explica qué falta */}
        <div className="form-gasto-acciones">
          <Button type="submit" variant="primary" fullWidth>
            Guardar gasto
          </Button>

          {faltantes.length > 0 && (
            <ul
              className={`faltantes ${intentoGuardar ? 'faltantes-error' : ''}`}
              role={intentoGuardar ? 'alert' : undefined}
            >
              {faltantes.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      </form>

      {/* Confirmación antes de descartar lo cargado */}
      <Modal
        isOpen={confirmarDescarte}
        onClose={() => setConfirmarDescarte(false)}
        title="¿Descartar este gasto?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmarDescarte(false)}>
              Seguir cargando
            </Button>
            <Button variant="danger" onClick={onCancelar}>
              Descartar
            </Button>
          </>
        }
      >
        Lo que cargaste hasta ahora se va a perder.
      </Modal>
    </div>
  );
};
