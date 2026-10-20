import React from 'react';
import { Plus } from 'lucide-react';

export interface FABProps {
  onClick: () => void;
  ariaLabel?: string;
}

export const FAB: React.FC<FABProps> = ({ onClick, ariaLabel = 'Agregar' }) => {
  return (
    <button onClick={onClick} aria-label={ariaLabel} className="fab-btn">
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
};
