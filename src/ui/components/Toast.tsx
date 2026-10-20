import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { ToastData } from '../../hooks/useToast';

export interface ToastProps {
  toast: ToastData | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className={`toast toast-${toast.tipo}`}>
          {toast.tipo === 'exito' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.mensaje}</span>
        </div>
      )}
    </div>
  );
};
