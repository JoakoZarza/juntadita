import React, { useState } from 'react';
import { Check, Copy, Spade, Trophy, Wallet } from 'lucide-react';
import { Juntada } from '../../core/types';
import { Button } from './Button';

export interface HeaderProps {
  juntada: Juntada;
  onNuevaJuntada: () => void;
  onAbrirModulo?: (modulo: 'futbol' | 'truco') => void;
}

export const Header: React.FC<HeaderProps> = ({
  juntada,
  onNuevaJuntada,
  onAbrirModulo,
}) => {
  const [copiado, setCopiado] = useState(false);

  const tieneFutbol =
    juntada.actividades.includes('Fútbol') ||
    (juntada.actividades as string[]).includes('Futbol');
  const tieneTruco =
    juntada.actividades.includes('Otros') ||
    (juntada.actividades as string[]).includes('Truco');

  const handleCopiarAlias = async () => {
    try {
      await navigator.clipboard.writeText(juntada.alias_cobro);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Si falla el portapapeles, ignorar o mantener estado
    }
  };

  return (
    <header className="app-header">
      <div className="app-header-info">
        <h1 className="font-title app-header-titulo" title={juntada.nombre}>
          {juntada.nombre}
        </h1>

        <div className="row gap-6">
          <Wallet size={14} color="var(--text-secondary)" />
          <span className="text-sm c-secondary mono">{juntada.alias_cobro}</span>

          <button
            onClick={handleCopiarAlias}
            className={`alias-copiar ${copiado ? 'is-copiado' : ''}`}
            title="Copiar alias"
            aria-label="Copiar alias"
          >
            {copiado ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      <div className="row gap-8">
        {tieneFutbol && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            iconOnly
            icon={<Trophy size={18} />}
            onClick={() => onAbrirModulo?.('futbol')}
            title="Cancha de Fútbol"
            aria-label="Cancha de Fútbol"
          />
        )}

        {tieneTruco && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            iconOnly
            icon={<Spade size={18} />}
            onClick={() => onAbrirModulo?.('truco')}
            title="Anotador de Truco"
            aria-label="Anotador de Truco"
          />
        )}

        <Button type="button" variant="outline" size="sm" pill onClick={onNuevaJuntada}>
          Nueva
        </Button>
      </div>
    </header>
  );
};
