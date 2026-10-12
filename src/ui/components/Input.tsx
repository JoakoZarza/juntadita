import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefixText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  prefixText,
  id,
  className = '',
  style,
  ...props
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            letterSpacing: '0.01em',
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        {prefixText && (
          <span
            style={{
              position: 'absolute',
              left: '14px',
              color: 'var(--text-secondary)',
              fontSize: '15px',
              fontWeight: 600,
              pointerEvents: 'none',
            }}
          >
            {prefixText}
          </span>
        )}

        <input
          id={inputId}
          className={`input-field ${className}`}
          style={{
            paddingLeft: prefixText ? '32px' : '14px',
            borderColor: error ? 'var(--accent-danger)' : 'var(--border-subtle)',
            ...style,
          }}
          {...props}
        />
      </div>

      {error && (
        <span
          style={{
            fontSize: '12px',
            color: 'var(--accent-danger)',
            marginTop: '2px',
            fontWeight: 500,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
};
