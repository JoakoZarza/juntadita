import React from 'react';
import { Plus } from 'lucide-react';

export interface FABProps {
  onClick: () => void;
  ariaLabel?: string;
}

export const FAB: React.FC<FABProps> = ({ onClick, ariaLabel = 'Agregar' }) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        position: 'fixed',
        bottom: 'calc(76px + var(--safe-bottom))',
        right: 'calc(50% - 220px)',
        zIndex: 45,
        width: '56px',
        height: '56px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'var(--accent-coral)',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 16px -2px rgba(224, 86, 56, 0.4)',
        border: 'none',
      }}
      className="fab-btn"
    >
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
};
