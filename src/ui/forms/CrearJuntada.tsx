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
  const [importando, setImportando] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const limpiarError = (campo: string) => {
    if (errores[campo]) {
      setErrores((prev) => {
        const resto = { ...prev };
        delete resto[campo];
        return resto;
      });
    }
  };

  const toggleActividad = (act: CategoriaGasto) => {
    limpiarError('actividades');
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
    { id: 'Otros', label: 'Truco y otros', icon: <Spade size={18} /> },
  ];

  return (
    <div className="crear-juntada">
      <div className="crear-intro">
        <div aria-hidden="true" className="crear-logo">
          <Flame size={26} />
        </div>
        <h1 className="font-title crear-titulo">Dividí los gastos de la juntada</h1>
        <p className="crear-bajada">
          Anotá quién puso plata, Juntadita calcula quién le debe a quién y te arma el mensaje
          para el grupo.
        </p>
        <ol className="onboarding-pasos">
          <li>Creá la juntada con tu alias de cobro.</li>
          <li>Sumá a los que vinieron y cargá los gastos.</li>
          <li>Copiá el resumen y mandalo por WhatsApp.</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="stack gap-20">
        <Input
          label="Nombre de la juntada"
          placeholder="Ej: Asado del Viernes"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            limpiarError('nombre');
          }}
          maxLength={60}
          error={errores.nombre}
        />

        <Input
          label="Tu apodo (Organizador)"
          placeholder="Ej: Joaco"
          value={apodo}
          onChange={(e) => {
            setApodo(e.target.value);
            limpiarError('apodo');
          }}
          maxLength={30}
          error={errores.apodo}
        />

        <Input
          label="Alias o CBU de cobro"
          placeholder="Ej: joaco.asado.mp"
          value={alias}
          onChange={(e) => {
            setAlias(e.target.value);
            limpiarError('alias');
          }}
          maxLength={60}
          error={errores.alias}
        />

        <div>
          <p id="label-actividades" className="field-label mb-10">
            Actividades previstas
          </p>

          <div className="actividades-grid" role="group" aria-labelledby="label-actividades">
            {listaOpciones.map((op) => {
              const isChecked = actividades.includes(op.id);
              return (
                <button
                  type="button"
                  key={op.id}
                  onClick={() => toggleActividad(op.id)}
                  aria-pressed={isChecked}
                  className={`actividad-opcion ${isChecked ? 'is-active' : ''}`}
                >
                  <span className="actividad-icono" aria-hidden="true">
                    {op.icon}
                  </span>
                  <span>{op.label}</span>
                </button>
              );
            })}
          </div>

          {errores.actividades && <span className="error-text">{errores.actividades}</span>}
        </div>

        <div className="mt-12">
          <Button type="submit" variant="primary" fullWidth>
            Crear juntada
          </Button>
        </div>

        {onImportar && (
          <div className="crear-importar">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="link-subrayado"
              disabled={importando}
            >
              {importando ? 'Importando backup…' : '¿Tenés un backup? Importar'}
            </button>

            <input
              type="file"
              accept=".json,application/json"
              ref={fileInputRef}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setErrorImport(null);
                setImportando(true);
                const res = await onImportar(file);
                setImportando(false);
                if (!res.ok) {
                  setErrorImport(res.error);
                }
                e.target.value = '';
              }}
              hidden
            />

            {errorImport && <div className="error-box text-xs mt-8">{errorImport}</div>}
          </div>
        )}
      </form>
    </div>
  );
};
