import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  icon,
  children,
  className = '',
  style,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--accent-coral)',
          color: '#FFFFFF',
          border: '1px solid var(--accent-coral)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--accent-danger-bg)',
          color: 'var(--accent-danger)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid transparent',
        };
    }
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minHeight: '48px',
    padding: '12px 18px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '15px',
    fontWeight: 600,
    fontFamily: 'var(--font-title)',
    width: fullWidth ? '100%' : 'auto',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.5 : 1,
    ...getVariantStyles(),
    ...style,
  };

  return (
    <button className={`btn ${className}`} style={baseStyles} {...props}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
};
