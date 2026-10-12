import { describe, expect, it } from 'vitest';
import { puedeBorrarGasto, puedeBorrarPersona } from './rules';
import { Juntada } from './types';

describe('Reglas de Negocio de Borrado (rules.ts)', () => {
  const juntadaBase: Juntada = {
    id: 'j-rules',
    nombre: 'Juntada de Prueba',
    alias_cobro: 'alias.prueba.mp',
    organizador_id: 'p-org',
    actividades: ['Asado'],
    personas: [
      { id: 'p-org', apodo: 'Organizador', es_organizador: true },
      { id: 'p-aportante', apodo: 'Aportante', es_organizador: false },
      { id: 'p-comensal', apodo: 'Comensal', es_organizador: false },
      { id: 'p-libre', apodo: 'Libre', es_organizador: false },
    ],
    gastos: [
      {
        id: 'g-1',
        categoria: 'Asado',
        monto_total: 10000,
        aportes: [{ persona_id: 'p-aportante', monto: 10000 }],
        participantes_ids: ['p-org', 'p-comensal'],
      },
    ],
    estado: 'abierta',
    created_at: '2026-10-12T10:00:00.000Z',
    updated_at: '2026-10-12T10:00:00.000Z',
  };

  it('1. no se puede borrar al organizador', () => {
    const res = puedeBorrarPersona(juntadaBase, 'p-org');
    expect(res.ok).toBe(false);
    expect(res.motivo).toMatch(/No se puede eliminar al organizador/);
  });

  it('2. no se puede borrar la última persona de la juntada', () => {
    const juntadaUnaPersona: Juntada = {
      ...juntadaBase,
      personas: [{ id: 'p-inv', apodo: 'Invitado Unico', es_organizador: false }],
      organizador_id: 'p-org-otro',
      gastos: [],
    };
    const res = puedeBorrarPersona(juntadaUnaPersona, 'p-inv');
    expect(res.ok).toBe(false);
    expect(res.motivo).toMatch(/No se puede eliminar la única persona/);
  });

  it('3. no se puede borrar una persona que aportó en algún gasto', () => {
    const res = puedeBorrarPersona(juntadaBase, 'p-aportante');
    expect(res.ok).toBe(false);
    expect(res.motivo).toMatch(/aportó en algún gasto/);
  });

  it('4. no se puede borrar una persona que participó en algún gasto', () => {
    const res = puedeBorrarPersona(juntadaBase, 'p-comensal');
    expect(res.ok).toBe(false);
    expect(res.motivo).toMatch(/participó en algún gasto/);
  });

  it('5. sí se puede borrar una persona que no participa ni aportó en nada', () => {
    const res = puedeBorrarPersona(juntadaBase, 'p-libre');
    expect(res.ok).toBe(true);
    expect(res.motivo).toBeUndefined();
  });

  it('6. no se puede borrar un gasto si la juntada está cerrada', () => {
    const juntadaCerrada: Juntada = {
      ...juntadaBase,
      estado: 'cerrada',
    };
    const res = puedeBorrarGasto(juntadaCerrada);
    expect(res.ok).toBe(false);
    expect(res.motivo).toMatch(/la juntada está cerrada/);
  });

  it('7. sí se puede borrar un gasto si la juntada está abierta', () => {
    const res = puedeBorrarGasto(juntadaBase);
    expect(res.ok).toBe(true);
    expect(res.motivo).toBeUndefined();
  });
});
