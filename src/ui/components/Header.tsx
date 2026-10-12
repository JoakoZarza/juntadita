import React, { useState } from 'react';
import { Check, Copy, Spade, Trophy, Wallet } from 'lucide-react';
import { Juntada } from '../../core/types';

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
    <header
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
        <h1
          className="font-title"
          style={{
            fontSize: '18px',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={juntada.nombre}
        >
          {juntada.nombre}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Wallet size={14} color="var(--text-secondary)" />
          <span
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontFamily: 'monospace',
            }}
          >
            {juntada.alias_cobro}
          </span>

          <button
            onClick={handleCopiarAlias}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              color: copiado ? 'var(--accent-emerald)' : 'var(--text-secondary)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              minHeight: '26px',
              minWidth: '26px',
            }}
            title="Copiar alias"
            aria-label="Copiar alias"
          >
            {copiado ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {tieneFutbol && (
          <button
            type="button"
            onClick={() => onAbrirModulo?.('futbol')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              width: '38px',
              height: '38px',
            }}
            title="Cancha de Fútbol"
            aria-label="Cancha de Fútbol"
          >
            <Trophy size={18} />
          </button>
        )}

        {tieneTruco && (
          <button
            type="button"
            onClick={() => onAbrirModulo?.('truco')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              width: '38px',
              height: '38px',
            }}
            title="Anotador de Truco"
            aria-label="Anotador de Truco"
          >
            <Spade size={18} />
          </button>
        )}

        <button
          onClick={onNuevaJuntada}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
            minHeight: '36px',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-coral)';
            e.currentTarget.style.color = 'var(--accent-coral)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
        >
          Nueva
        </button>
      </div>
    </header>
  );
};
