import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastTipo = 'exito' | 'error';

export interface ToastAccion {
  label: string;
  onClick: () => void;
}

export interface ToastData {
  id: number;
  mensaje: string;
  tipo: ToastTipo;
  accion?: ToastAccion;
}

const DURACION_MS = 2600;
// Con una acción ("Deshacer") hay que dar tiempo a leer y tocar
const DURACION_CON_ACCION_MS = 5000;

/**
 * Estado de un único toast visible a la vez. Mostrar uno nuevo reemplaza al anterior.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cerrarToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const mostrarToast = useCallback(
    (mensaje: string, tipo: ToastTipo = 'exito', accion?: ToastAccion) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ id: Date.now(), mensaje, tipo, accion });
      timerRef.current = setTimeout(
        () => setToast(null),
        accion ? DURACION_CON_ACCION_MS : DURACION_MS
      );
    },
    []
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { toast, mostrarToast, cerrarToast };
}
