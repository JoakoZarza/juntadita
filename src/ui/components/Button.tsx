import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** md: 48px de alto (acciones principales). sm: 36px (acciones secundarias, headers) */
  size?: ButtonSize;
  /** Botón cuadrado solo con ícono: requiere aria-label */
  iconOnly?: boolean;
  /** Bordes totalmente redondeados */
  pill?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  pill = false,
  fullWidth = false,
  icon,
  children,
  className = '',
  ...props
}) => {
  const clases = [
    'btn',
    `btn-${variant}`,
    size === 'sm' && 'btn-sm',
    iconOnly && 'btn-icon-only',
    (pill || iconOnly) && 'btn-pill',
    fullWidth && 'btn-full',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={clases} {...props}>
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
};
