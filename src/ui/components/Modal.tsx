import React, { useEffect, useRef } from 'react';

const FOCUSABLES =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  /** Acciones una debajo de otra (para 3 botones o textos largos) */
  apilarAcciones?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  apilarAcciones = false,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Al abrir: foco adentro del modal; al cerrar: devolverlo a donde estaba
  useEffect(() => {
    if (!isOpen) return;
    const previo = document.activeElement as HTMLElement | null;
    const primero = dialogRef.current?.querySelector<HTMLElement>('.modal-actions ' + FOCUSABLES);
    (primero || dialogRef.current)?.focus();
    return () => previo?.focus?.();
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Tab y Shift+Tab circulan solo entre los elementos del modal
      if (e.key === 'Tab' && dialogRef.current) {
        const elementos = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLES)
        );
        if (elementos.length === 0) return;
        const primero = elementos[0];
        const ultimo = elementos[elementos.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="card modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="modal-title" className="font-title modal-titulo">
            {title}
          </h3>
          <button onClick={onClose} className="modal-cerrar" aria-label="Cerrar modal">
            ✕
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {actions && (
          <div className={`modal-actions ${apilarAcciones ? 'modal-actions-apiladas' : ''}`}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
