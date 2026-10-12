import React from 'react';
import { Beer, Flame, Spade, Trophy } from 'lucide-react';
import { CategoriaGasto } from '../../core/types';

export interface ChipProps {
  label: string;
  categoria?: CategoriaGasto;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function getIconoCategoria(cat: CategoriaGasto, size = 16): React.ReactNode {
  switch (cat) {
    case 'Asado':
      return <Flame size={size} />;
    case 'Fútbol':
      return <Trophy size={size} />;
    case 'Bebidas':
      return <Beer size={size} />;
    case 'Otros':
      return <Spade size={size} />;
  }
}

export const Chip: React.FC<ChipProps> = ({
  label,
  categoria,
  icon,
  active = false,
  onClick,
  size = 'md',
}) => {
  const iconNode = icon || (categoria ? getIconoCategoria(categoria, size === 'sm' ? 14 : 16) : null);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip ${active ? 'chip-active' : 'chip-inactive'} ${size === 'sm' ? 'chip-sm' : ''}`}
    >
      {iconNode && <span className="chip-icon">{iconNode}</span>}
      <span>{label}</span>
    </button>
  );
};
