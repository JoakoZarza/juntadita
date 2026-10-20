import React, { useState } from 'react';
import { Lock, Trash2, UserPlus, Users } from 'lucide-react';
import { puedeBorrarPersona } from '../../core/rules';
import { Juntada } from '../../core/types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';

export interface PersonasViewProps {
  juntada: Juntada;
  onAgregarPersona: (apodo: string, alias_cobro?: string) => { ok: true } | { ok: false; error: string };
  onEliminarPersona: (personaId: string) => { ok: true } | { ok: false; error: string };
  onActualizarAliasPersona?: (personaId: string, alias: string) => void;
}

export const PersonasView: React.FC<PersonasViewProps> = ({
  juntada,
  onAgregarPersona,
  onEliminarPersona,
  onActualizarAliasPersona,
}) => {
  const [nuevoApodo, setNuevoApodo] = useState('');
  const [nuevoAlias, setNuevoAlias] = useState('');
  const [errorInput, setErrorInput] = useState<string | null>(null);
  const [personaABorrar, setPersonaABorrar] = useState<{ id: string; apodo: string } | null>(null);

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

      {/* Formulario rápido para sumar comensal */}
      {!estaCerrada && (
      <form onSubmit={handleSumar} className="card stack gap-10">
        <div className="stack gap-8">
          <Input
            placeholder="Apodo del pibe..."
            value={nuevoApodo}
            onChange={(e) => {
              setNuevoApodo(e.target.value);
              if (errorInput) setErrorInput(null);
            }}
            error={errorInput || undefined}
          />

          <div className="row gap-8">
            <input
              type="text"
              placeholder="Alias de cobro (opcional)"
              value={nuevoAlias}
              onChange={(e) => setNuevoAlias(e.target.value)}
              className="input-alias-nuevo"
            />

            <Button type="submit" variant="primary" icon={<UserPlus size={18} />}>
              Sumar
            </Button>
          </div>
        </div>
      </form>
      )}

      {/* Lista de comensales */}
      <div className="stack gap-10">
        {juntada.personas.length === 0 ? (
          <div className="card card-vacia">Todavía no hay nadie. Sumá al primer pibe.</div>
        ) : (
          juntada.personas.map((persona) => {
            const validacionBorrado = puedeBorrarPersona(juntada, persona.id);
            const inicial = persona.apodo.charAt(0).toUpperCase();

            return (
              <div key={persona.id} className="card persona-card">
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
                        value={persona.alias_cobro || ''}
                        onChange={(e) => onActualizarAliasPersona?.(persona.id, e.target.value)}
                        className={`input-alias-inline ${persona.alias_cobro ? 'has-value' : ''}`}
                      />
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
                    onClick={() => {
                      if (validacionBorrado.ok) {
                        setPersonaABorrar({ id: persona.id, apodo: persona.apodo });
                      }
                    }}
                    disabled={!validacionBorrado.ok}
                    title={validacionBorrado.ok ? 'Eliminar persona' : validacionBorrado.motivo}
                    aria-label={`Eliminar a ${persona.apodo}`}
                  />
                )}
              </div>
            );
          })
        )}
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
