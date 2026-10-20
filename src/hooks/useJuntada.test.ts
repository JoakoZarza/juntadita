import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useJuntada } from './useJuntada';

describe('useJuntada', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const montarJuntadaConGasto = () => {
    const hook = renderHook(() => useJuntada());

    act(() => {
      hook.result.current.crearJuntada({
        nombre: 'Asado',
        apodo: 'Joaco',
        alias_cobro: 'joaco.mp',
        actividades: ['Asado'],
      });
    });
    act(() => {
      hook.result.current.agregarPersona('Fede');
    });

    const [org, fede] = hook.result.current.juntada!.personas;
    act(() => {
      hook.result.current.agregarGasto({
        categoria: 'Asado',
        monto_total: 1000,
        aportes: [{ persona_id: org.id, monto: 1000 }],
        participantes_ids: [org.id, fede.id],
      });
    });

    return hook;
  };

  it('restaurarGasto devuelve el gasto borrado aunque se llame con una referencia vieja', () => {
    const hook = montarJuntadaConGasto();
    const gasto = hook.result.current.juntada!.gastos[0];
    // Referencia del render en que el gasto todavía existía, como la que guarda el toast
    const restaurarDeAntes = hook.result.current.restaurarGasto;

    act(() => {
      hook.result.current.eliminarGasto(gasto.id);
    });
    expect(hook.result.current.juntada!.gastos).toHaveLength(0);

    act(() => {
      restaurarDeAntes(gasto, 0);
    });
    expect(hook.result.current.juntada!.gastos.map((g) => g.id)).toEqual([gasto.id]);
  });

  it('rechaza aportantes duplicados', () => {
    const hook = montarJuntadaConGasto();
    const [org, fede] = hook.result.current.juntada!.personas;

    let res: ReturnType<typeof hook.result.current.agregarGasto> | undefined;
    act(() => {
      res = hook.result.current.agregarGasto({
        categoria: 'Asado',
        monto_total: 300,
        aportes: [
          { persona_id: org.id, monto: 100 },
          { persona_id: org.id, monto: 200 },
        ],
        participantes_ids: [org.id, fede.id],
      });
    });
    expect(res?.ok).toBe(false);
  });

  it('no deja sumar personas con la juntada cerrada', () => {
    const hook = montarJuntadaConGasto();
    act(() => {
      hook.result.current.cerrarJuntada();
    });

    let res: ReturnType<typeof hook.result.current.agregarPersona> | undefined;
    act(() => {
      res = hook.result.current.agregarPersona('Nico');
    });
    expect(res?.ok).toBe(false);
    expect(hook.result.current.juntada!.personas).toHaveLength(2);
  });
});
