import React, { useEffect } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(16px + var(--safe-top)) 16px calc(16px + var(--safe-bottom)) 16px',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '12px',
          }}
        >
          <h3
            id="modal-title"
            className="font-title"
            style={{ fontSize: '18px', color: 'var(--text-primary)' }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              color: 'var(--text-secondary)',
              fontSize: '18px',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              minHeight: '36px',
              minWidth: '36px',
            }}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
          {children}
        </div>

        {actions && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
              paddingTop: '8px',
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
