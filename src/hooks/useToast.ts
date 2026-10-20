import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastTipo = 'exito' | 'error';

export interface ToastData {
  id: number;
  mensaje: string;
  tipo: ToastTipo;
}

const DURACION_MS = 2600;

/**
 * Estado de un único toast visible a la vez. Mostrar uno nuevo reemplaza al anterior.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarToast = useCallback((mensaje: string, tipo: ToastTipo = 'exito') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ id: Date.now(), mensaje, tipo });
    timerRef.current = setTimeout(() => setToast(null), DURACION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { toast, mostrarToast };
}
