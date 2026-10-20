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

        <input id={inputId} className={clases} {...props} />
      </div>

      {error && <span className="field-error">{error}</span>}
    </div>
  );
};
