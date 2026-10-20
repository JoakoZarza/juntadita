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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="screen-title">
        <Users size={22} color="var(--accent-coral)" />
        <span>Personas ({juntada.personas.length})</span>
      </div>

      {/* Juntada cerrada: no se suman ni se quitan personas */}
      {estaCerrada && (
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(245, 166, 35, 0.1)',
            borderColor: 'rgba(245, 166, 35, 0.3)',
            color: 'var(--accent-amber)',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <Lock size={18} />
          <span>Juntada cerrada. Reabrila desde Resumen para sumar personas.</span>
        </div>
      )}

      {/* Formulario rápido para sumar comensal */}
      {!estaCerrada && (
      <form onSubmit={handleSumar} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Input
            placeholder="Apodo del pibe..."
            value={nuevoApodo}
            onChange={(e) => {
              setNuevoApodo(e.target.value);
              if (errorInput) setErrorInput(null);
            }}
            error={errorInput || undefined}
          />

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Alias de cobro (opcional)"
              value={nuevoAlias}
              onChange={(e) => setNuevoAlias(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                minHeight: '44px',
              }}
            />

            <Button type="submit" variant="primary" icon={<UserPlus size={18} />}>
              Sumar
            </Button>
          </div>
        </div>
      </form>
      )}

      {/* Lista de comensales */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {juntada.personas.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'var(--text-secondary)',
            }}
          >
            Todavía no hay nadie. Sumá al primer pibe.
          </div>
        ) : (
          juntada.personas.map((persona) => {
            const validacionBorrado = puedeBorrarPersona(juntada, persona.id);
            const inicial = persona.apodo.charAt(0).toUpperCase();

            return (
              <div
                key={persona.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  {/* Avatar inicial */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: persona.es_organizador
                        ? 'var(--accent-coral)'
                        : 'var(--border-subtle)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-title)',
                      fontWeight: 700,
                      fontSize: '16px',
                      flexShrink: 0,
                    }}
                  >
                    {inicial}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {persona.apodo}
                      </span>

                      {persona.es_organizador && (
                        <span className="badge-organizador">
                          Organizador
                        </span>
                      )}
                    </div>

                    {/* Fila de alias de cobro */}
                    {persona.es_organizador ? (
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          fontFamily: 'monospace',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
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
                        style={{
                          fontSize: '12px',
                          color: persona.alias_cobro ? 'var(--text-primary)' : 'var(--text-secondary)',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '3px 8px',
                          fontFamily: 'monospace',
                          width: '100%',
                          maxWidth: '180px',
                          outline: 'none',
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Botón de eliminar */}
                {!persona.es_organizador && !estaCerrada && (
                  <button
                    onClick={() => {
                      if (validacionBorrado.ok) {
                        setPersonaABorrar({ id: persona.id, apodo: persona.apodo });
                      }
                    }}
                    disabled={!validacionBorrado.ok}
                    title={validacionBorrado.ok ? 'Eliminar persona' : validacionBorrado.motivo}
                    aria-label={`Eliminar a ${persona.apodo}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-sm)',
                      color: validacionBorrado.ok
                        ? 'var(--text-secondary)'
                        : 'var(--text-muted)',
                      backgroundColor: 'transparent',
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
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
        <strong style={{ color: 'var(--text-primary)' }}>{personaABorrar?.apodo}</strong> de la juntada?
      </Modal>
    </div>
  );
};
