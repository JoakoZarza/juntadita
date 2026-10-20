import React, { useEffect, useRef, useState } from 'react';
import { Info, Lock, Trash2, UserPlus, Users } from 'lucide-react';
import { puedeBorrarPersona } from '../../core/rules';
import { Juntada } from '../../core/types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';

export interface PersonasViewProps {
  juntada: Juntada;
  onAgregarPersona: (
    apodo: string,
    alias_cobro?: string
  ) => { ok: true; id: string } | { ok: false; error: string };
  onEliminarPersona: (personaId: string) => { ok: true } | { ok: false; error: string };
  onActualizarAliasPersona?: (personaId: string, alias: string) => void;
  /** Cambia cada vez que el botón + pide enfocar el campo de apodo */
  pedidoFocoApodo?: number;
}

export const PersonasView: React.FC<PersonasViewProps> = ({
  juntada,
  onAgregarPersona,
  onEliminarPersona,
  onActualizarAliasPersona,
  pedidoFocoApodo,
}) => {
  const [nuevoApodo, setNuevoApodo] = useState('');
  const [nuevoAlias, setNuevoAlias] = useState('');
  const [errorInput, setErrorInput] = useState<string | null>(null);
  const [personaABorrar, setPersonaABorrar] = useState<{ id: string; apodo: string } | null>(null);
  const [personaNuevaId, setPersonaNuevaId] = useState<string | null>(null);
  // Motivo por el que no se puede quitar a alguien (en mobile no hay tooltip)
  const [motivoBloqueo, setMotivoBloqueo] = useState<{ id: string; texto: string } | null>(null);
  const apodoRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pedidoFocoApodo) apodoRef.current?.focus();
  }, [pedidoFocoApodo]);

  // Lleva la vista a la persona recién sumada y apaga el resaltado al terminar la animación
  useEffect(() => {
    if (!personaNuevaId) return;
    listaRef.current
      ?.querySelector(`[data-persona-id="${personaNuevaId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const t = setTimeout(() => setPersonaNuevaId(null), 1600);
    return () => clearTimeout(t);
  }, [personaNuevaId]);

  const handleSumar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoApodo.trim()) {
      setErrorInput('Ingresá un apodo.');
      return;
    }

    const res = onAgregarPersona(nuevoApodo.trim(), nuevoAlias.trim() || undefined);
    if (res.ok) {
      setNuevoApodo('');
      setNuevoAlias('');
      setErrorInput(null);
      setPersonaNuevaId(res.id);
    } else {
      setErrorInput(res.error);
    }
  };

  const estaCerrada = juntada.estado === 'cerrada';

  const handleConfirmarBorrado = () => {
    if (!personaABorrar) return;
    onEliminarPersona(personaABorrar.id);
    setPersonaABorrar(null);
  };

  return (
    <div className="stack gap-20">
      <div className="screen-title">
        <Users size={22} color="var(--accent-coral)" />
        <span>Personas ({juntada.personas.length})</span>
      </div>

      {/* Juntada cerrada: no se suman ni se quitan personas */}
      {estaCerrada && (
        <div className="card aviso-cerrada">
          <Lock size={18} />
          <span>Juntada cerrada. Reabrila desde Resumen para sumar personas.</span>
        </div>
      )}

      {/* Formulario rápido para sumar a alguien */}
      {!estaCerrada && (
        <form onSubmit={handleSumar} className="card stack gap-10">
          <div className="stack gap-8">
            <Input
              ref={apodoRef}
              labelOculto="Apodo de la persona"
              placeholder="Apodo (ej: Fede)"
              value={nuevoApodo}
              maxLength={30}
              onChange={(e) => {
                setNuevoApodo(e.target.value);
                if (errorInput) setErrorInput(null);
              }}
              error={errorInput || undefined}
            />

            <div className="row gap-8">
              <Input
                labelOculto="Alias de cobro (opcional)"
                placeholder="Alias de cobro (opcional)"
                value={nuevoAlias}
                maxLength={60}
                onChange={(e) => setNuevoAlias(e.target.value)}
              />

              <Button type="submit" variant="primary" icon={<UserPlus size={18} />}>
                Sumar
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Solo está el organizador: explicar el siguiente paso */}
      {!estaCerrada && juntada.personas.length === 1 && (
        <div className="card aviso-info">
          <Info size={18} />
          <span>Sumá a los que vinieron para poder dividir los gastos entre todos.</span>
        </div>
      )}

      {/* Lista de personas */}
      <div className="stack gap-10" ref={listaRef}>
        {juntada.personas.map((persona) => {
            const validacionBorrado = puedeBorrarPersona(juntada, persona.id);
            const inicial = persona.apodo.charAt(0).toUpperCase();

            return (
              <div
                key={persona.id}
                data-persona-id={persona.id}
                className={`card persona-card ${persona.id === personaNuevaId ? 'persona-card-nueva' : ''}`}
              >
                <div className="row gap-12 flex-1">
                  {/* Avatar inicial */}
                  <div className={`avatar-lg ${persona.es_organizador ? 'is-organizador' : ''}`}>
                    {inicial}
                  </div>

                  <div className="stack gap-3 flex-1">
                    <div className="row gap-8">
                      <span className="nombre truncate">{persona.apodo}</span>

                      {persona.es_organizador && (
                        <span className="badge-organizador">
                          Organizador
                        </span>
                      )}
                    </div>

                    {/* Fila de alias de cobro */}
                    {persona.es_organizador ? (
                      <span
                        className="text-xs c-secondary mono truncate"
                        title={`Alias: ${juntada.alias_cobro}`}
                      >
                        Alias: {juntada.alias_cobro}
                      </span>
                    ) : (
                      <input
                        type="text"
                        placeholder="Alias (opcional)"
                        aria-label={`Alias de cobro de ${persona.apodo}`}
                        maxLength={60}
                        value={persona.alias_cobro || ''}
                        onChange={(e) => onActualizarAliasPersona?.(persona.id, e.target.value)}
                        className={`input-alias-inline ${persona.alias_cobro ? 'has-value' : ''}`}
                      />
                    )}

                    {motivoBloqueo?.id === persona.id && (
                      <span className="persona-motivo" role="status">
                        {motivoBloqueo.texto}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botón de eliminar */}
                {!persona.es_organizador && !estaCerrada && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    iconOnly
                    icon={<Trash2 size={18} />}
                    className={validacionBorrado.ok ? '' : 'is-bloqueado'}
                    onClick={() => {
                      if (validacionBorrado.ok) {
                        setMotivoBloqueo(null);
                        setPersonaABorrar({ id: persona.id, apodo: persona.apodo });
                      } else {
                        setMotivoBloqueo({
                          id: persona.id,
                          texto: validacionBorrado.motivo || 'No se puede quitar a esta persona.',
                        });
                      }
                    }}
                    title={validacionBorrado.ok ? 'Eliminar persona' : validacionBorrado.motivo}
                    aria-label={`Eliminar a ${persona.apodo}`}
                  />
                )}
              </div>
            );
        })}
      </div>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={personaABorrar !== null}
        onClose={() => setPersonaABorrar(null)}
        title="Eliminar persona"
        actions={
          <>
            <Button variant="secondary" onClick={() => setPersonaABorrar(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmarBorrado}>
              Eliminar
            </Button>
          </>
        }
      >
        ¿Estás seguro de que querés eliminar a{' '}
        <strong>{personaABorrar?.apodo}</strong> de la juntada?
      </Modal>
    </div>
  );
};
