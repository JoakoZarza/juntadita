import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefixText?: string;
  /** Etiqueta solo para lectores de pantalla, cuando no hay label visible */
  labelOculto?: string;
  ref?: React.Ref<HTMLInputElement>;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  prefixText,
  labelOculto,
  ref,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const clases = ['input-field', prefixText && 'has-prefix', error && 'has-error', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="field">
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      )}

      <div className="field-control">
        {prefixText && <span className="field-prefix">{prefixText}</span>}

        <input
          ref={ref}
          id={inputId}
          className={clases}
          aria-label={label ? undefined : labelOculto}
          aria-invalid={error ? true : undefined}
          {...props}
        />
      </div>

      {error && <span className="field-error">{error}</span>}
    </div>
  );
};
