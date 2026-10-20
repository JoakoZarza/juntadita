import React, { useRef, useState } from 'react';
import { Beer, Flame, Spade, Trophy } from 'lucide-react';
import { CategoriaGasto } from '../../core/types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export interface CrearJuntadaProps {
  onSubmit: (datos: {
    nombre: string;
    apodo: string;
    alias_cobro: string;
    actividades: CategoriaGasto[];
  }) => void;
  onImportar?: (file: File) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export const CrearJuntada: React.FC<CrearJuntadaProps> = ({ onSubmit, onImportar }) => {
  const [nombre, setNombre] = useState('');
  const [apodo, setApodo] = useState('');
  const [alias, setAlias] = useState('');
  const [actividades, setActividades] = useState<CategoriaGasto[]>(['Asado', 'Bebidas']);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorImport, setErrorImport] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleActividad = (act: CategoriaGasto) => {
    if (actividades.includes(act)) {
      setActividades(actividades.filter((a) => a !== act));
    } else {
      setActividades([...actividades, act]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevosErrores: Record<string, string> = {};

    if (!nombre.trim()) nuevosErrores.nombre = 'Ingresá el nombre de la juntada.';
    if (!apodo.trim()) nuevosErrores.apodo = 'Ingresá tu apodo (organizador).';
    if (!alias.trim()) nuevosErrores.alias = 'Ingresá tu alias o CBU de cobro.';
    if (actividades.length === 0) {
      nuevosErrores.actividades = 'Seleccioná al menos una actividad prevista.';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setErrores({});
    onSubmit({
      nombre: nombre.trim(),
      apodo: apodo.trim(),
      alias_cobro: alias.trim(),
      actividades,
    });
  };

  const listaOpciones: Array<{ id: CategoriaGasto; label: string; icon: React.ReactNode }> = [
    { id: 'Asado', label: 'Asado', icon: <Flame size={18} /> },
    { id: 'Fútbol', label: 'Fútbol', icon: <Trophy size={18} /> },
    { id: 'Bebidas', label: 'Bebidas', icon: <Beer size={18} /> },
    { id: 'Otros', label: 'Truco', icon: <Spade size={18} /> },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '24px 20px calc(24px + var(--safe-bottom)) 20px',
        maxWidth: '440px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div style={{ marginBottom: '28px' }}>
        <div
          aria-hidden="true"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(224, 86, 56, 0.12)',
            color: 'var(--accent-coral)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <Flame size={26} />
        </div>
        <h1
          className="font-title"
          style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '8px' }}
        >
          Dividí los gastos de la juntada
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '16px' }}>
          Anotá quién puso plata, Juntadita calcula quién le debe a quién y te arma el mensaje
          para el grupo.
        </p>
        <ol className="onboarding-pasos">
          <li>Creá la juntada con tu alias de cobro.</li>
          <li>Sumá a los que vinieron y cargá los gastos.</li>
          <li>Copiá el resumen y mandalo por WhatsApp.</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Input
          label="Nombre de la juntada"
          placeholder="Ej: Asado del Viernes"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          error={errores.nombre}
        />

        <Input
          label="Tu apodo (Organizador)"
          placeholder="Ej: Joaco"
          value={apodo}
          onChange={(e) => setApodo(e.target.value)}
          error={errores.apodo}
        />

        <Input
          label="Alias o CBU de cobro"
          placeholder="Ej: joaco.asado.mp"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          error={errores.alias}
        />

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
            Actividades previstas
          </label>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
            }}
          >
            {listaOpciones.map((op) => {
              const isChecked = actividades.includes(op.id);
              return (
                <button
                  type="button"
                  key={op.id}
                  onClick={() => toggleActividad(op.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: isChecked ? 'var(--accent-coral)' : 'var(--border-subtle)',
                    backgroundColor: isChecked ? 'rgba(224, 86, 56, 0.12)' : 'var(--bg-card)',
                    color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isChecked ? 600 : 500,
                    fontSize: '14px',
                    minHeight: '48px',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      color: isChecked ? 'var(--accent-coral)' : 'var(--text-secondary)',
                      display: 'flex',
                    }}
                  >
                    {op.icon}
                  </span>
                  <span>{op.label}</span>
                </button>
              );
            })}
          </div>

          {errores.actividades && (
            <span
              style={{
                fontSize: '12px',
                color: 'var(--accent-danger)',
                marginTop: '6px',
                display: 'block',
              }}
            >
              {errores.actividades}
            </span>
          )}
        </div>

        <div style={{ marginTop: '12px' }}>
          <Button type="submit" variant="primary" fullWidth>
            Crear juntada
          </Button>
        </div>

        {onImportar && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                padding: '8px',
                background: 'none',
                border: 'none',
              }}
            >
              ¿Tenés un backup? Importar
            </button>

            <input
              type="file"
              accept=".json,application/json"
              ref={fileInputRef}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setErrorImport(null);
                const res = await onImportar(file);
                if (!res.ok) {
                  setErrorImport(res.error);
                }
                e.target.value = '';
              }}
              style={{ display: 'none' }}
            />

            {errorImport && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--accent-danger-bg)',
                  color: 'var(--accent-danger)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                }}
              >
                {errorImport}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};
