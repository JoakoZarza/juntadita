import { describe, expect, it } from 'vitest';
import { calcularLiquidacionMinimizada } from './balance';
import { Gasto, Persona } from './types';

describe('calcularLiquidacionMinimizada', () => {
  const pOrganizador: Persona = { id: 'p1', apodo: 'Marcos', es_organizador: true };
  const pJuan: Persona = { id: 'p2', apodo: 'Juan', es_organizador: false };
  const pMatias: Persona = { id: 'p3', apodo: 'Matías', es_organizador: false };
  const pPedro: Persona = { id: 'p4', apodo: 'Pedro', es_organizador: false };

  // 1. Caso trivial: un solo deudor y un solo acreedor.
  it('1. Caso trivial: un solo deudor y un solo acreedor', () => {
    const personas: Persona[] = [
      { id: 'p1', apodo: 'Marcos', es_organizador: true },
      { id: 'p2', apodo: 'Juan', es_organizador: false },
    ];
    // Marcos paga $1000 que consumen ambos ($500 c/u)
    const gastos: Gasto[] = [
      {
        id: 'g1',
        categoria: 'Asado',
        monto_total: 1000,
        aportes: [{ persona_id: 'p1', monto: 1000 }],
        participantes_ids: ['p1', 'p2'],
      },
    ];

    const res = calcularLiquidacionMinimizada(personas, gastos);

    expect(res.transferencias).toHaveLength(1);
    expect(res.transferencias[0]).toEqual({
      from_persona_id: 'p2',
      from_apodo: 'Juan',
      to_persona_id: 'p1',
      to_apodo: 'Marcos',
      monto: 500,
    });
    expect(res.totales.total_general).toBe(1000);
  });

  // 2. Caso del ejemplo del usuario: 3 deudores, 1 acreedor grande, todos pagan al acreedor.
  it('2. Caso del usuario: 3 deudores ($150 c/u) y 1 acreedor ($450) -> 3 transferencias directas', () => {
    const personas: Persona[] = [pOrganizador, pJuan, pMatias, pPedro];
    // Marcos pagó $600 consumido equitativamente por los 4 ($150 c/u).
    // Marcos: puso 600, consumió 150 -> saldo +450.
    // Juan, Matías, Pedro: pusieron 0, consumieron 150 -> saldo -150 c/u.
    const gastos: Gasto[] = [
      {
        id: 'g1',
        categoria: 'Asado',
        monto_total: 600,
        aportes: [{ persona_id: 'p1', monto: 600 }],
        participantes_ids: ['p1', 'p2', 'p3', 'p4'],
      },
    ];

    const res = calcularLiquidacionMinimizada(personas, gastos);

    expect(res.transferencias).toHaveLength(3);
    const sumaTransfers = res.transferencias.reduce((sum, t) => sum + t.monto, 0);
    expect(sumaTransfers).toBe(450);

    for (const t of res.transferencias) {
      expect(t.to_persona_id).toBe('p1');
      expect(t.to_apodo).toBe('Marcos');
      expect(t.monto).toBe(150);
    }

    const deudoresIds = res.transferencias.map((t) => t.from_persona_id).sort();
    expect(deudoresIds).toEqual(['p2', 'p3', 'p4']);
  });

  // 3. Caso sin deudas: todos con saldo 0. Cero transferencias.
  it('3. Caso sin deudas: todos con saldo 0 -> cero transferencias', () => {
    const personas: Persona[] = [pOrganizador, pJuan];
    // Ambos pusieron $500 y consumieron $500
    const gastos: Gasto[] = [
      {
        id: 'g1',
        categoria: 'Bebidas',
        monto_total: 1000,
        aportes: [
          { persona_id: 'p1', monto: 500 },
          { persona_id: 'p2', monto: 500 },
        ],
        participantes_ids: ['p1', 'p2'],
      },
    ];

    const res = calcularLiquidacionMinimizada(personas, gastos);
    expect(res.transferencias).toHaveLength(0);
    expect(res.balances_individuales.every((b) => b.saldo === 0)).toBe(true);
  });

  // 4. Caso cadena: A debe a B, B debe a C, C debe a D -> directo A -> D.
  it('4. Caso cadena: A debe a B, B debe a C, C debe a D -> se minimiza a A→D directamente', () => {
    const pA: Persona = { id: 'a', apodo: 'A', es_organizador: false };
    const pB: Persona = { id: 'b', apodo: 'B', es_organizador: false };
    const pC: Persona = { id: 'c', apodo: 'C', es_organizador: false };
    const pD: Persona = { id: 'd', apodo: 'D', es_organizador: true };

    // Gasto 1: B paga 100 para A -> A debe 100 a B
    // Gasto 2: C paga 100 para B -> B debe 100 a C
    // Gasto 3: D paga 100 para C -> C debe 100 a D
    const gastos: Gasto[] = [
      {
        id: 'g1',
        categoria: 'Otros',
        monto_total: 100,
        aportes: [{ persona_id: 'b', monto: 100 }],
        participantes_ids: ['a'],
      },
      {
        id: 'g2',
        categoria: 'Otros',
        monto_total: 100,
        aportes: [{ persona_id: 'c', monto: 100 }],
        participantes_ids: ['b'],
      },
      {
        id: 'g3',
        categoria: 'Otros',
        monto_total: 100,
        aportes: [{ persona_id: 'd', monto: 100 }],
        participantes_ids: ['c'],
      },
    ];

    const res = calcularLiquidacionMinimizada([pA, pB, pC, pD], gastos);

    // B y C quedan en 0. Solo A tiene -100 y D tiene +100.
    expect(res.transferencias).toHaveLength(1);
    expect(res.transferencias[0]).toEqual({
      from_persona_id: 'a',
      from_apodo: 'A',
      to_persona_id: 'd',
      to_apodo: 'D',
      monto: 100,
    });
  });

  // 5. INVARIANTE: suma de transferencias = suma de balances positivos.
  it('5. INVARIANTE: suma de transferencias = suma de balances positivos', () => {
    const personas: Persona[] = [
      { id: 'p1', apodo: 'A', es_organizador: true },
      { id: 'p2', apodo: 'B', es_organizador: false },
      { id: 'p3', apodo: 'C', es_organizador: false },
      { id: 'p4', apodo: 'D', es_organizador: false },
      { id: 'p5', apodo: 'E', es_organizador: false },
    ];

    const gastos: Gasto[] = [
      {
        id: 'g1',
        categoria: 'Asado',
        monto_total: 12500,
        aportes: [
          { persona_id: 'p1', monto: 8000 },
          { persona_id: 'p2', monto: 4500 },
        ],
        participantes_ids: ['p1', 'p2', 'p3', 'p4', 'p5'],
      },
      {
        id: 'g2',
        categoria: 'Bebidas',
        monto_total: 6000,
        aportes: [{ persona_id: 'p3', monto: 6000 }],
        participantes_ids: ['p1', 'p2', 'p3'],
      },
    ];

    const res = calcularLiquidacionMinimizada(personas, gastos);

    const sumaBalancesPositivos = res.balances_individuales
      .filter((b) => b.saldo > 0)
      .reduce((acc, b) => acc + b.saldo, 0);

    const sumaTransferencias = res.transferencias.reduce((acc, t) => acc + t.monto, 0);

    expect(sumaTransferencias).toBe(sumaBalancesPositivos);
  });

  // 6. INVARIANTE: ningún balance individual queda abierto tras las transferencias.
  it('6. INVARIANTE: ningún balance individual queda abierto tras las transferencias (todos en 0)', () => {
    const personas: Persona[] = [
      { id: '1', apodo: 'Org', es_organizador: true },
      { id: '2', apodo: 'P2', es_organizador: false },
      { id: '3', apodo: 'P3', es_organizador: false },
      { id: '4', apodo: 'P4', es_organizador: false },
    ];

    const gastos: Gasto[] = [
      {
        id: 'g1',
        categoria: 'Fútbol',
        monto_total: 8000,
        aportes: [
          { persona_id: '1', monto: 5000 },
          { persona_id: '2', monto: 3000 },
        ],
        participantes_ids: ['1', '2', '3', '4'],
      },
    ];

    const res = calcularLiquidacionMinimizada(personas, gastos);

    // Recreamos los balances partiendo de balances_individuales y aplicando transferencias
    const balanceFinal = new Map<string, number>();
    for (const b of res.balances_individuales) {
      balanceFinal.set(b.persona_id, b.saldo);
    }

    for (const t of res.transferencias) {
      // Deudor transfiere -> suma a su saldo para llegar a 0
      balanceFinal.set(
        t.from_persona_id,
        balanceFinal.get(t.from_persona_id)! + t.monto
      );
      // Acreedor recibe -> resta a su saldo positivo para llegar a 0
      balanceFinal.set(
        t.to_persona_id,
        balanceFinal.get(t.to_persona_id)! - t.monto
      );
    }

    for (const [pId, saldoFinal] of balanceFinal.entries()) {
      expect(saldoFinal, `Persona ${pId} no quedó saldada`).toBe(0);
    }
  });

  // 7. INVARIANTE: cantidad de transferencias <= N-1.
  it('7. INVARIANTE: cantidad de transferencias <= N - 1', () => {
    const personas: Persona[] = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i + 1}`,
      apodo: `P${i + 1}`,
      es_organizador: i === 0,
    }));

    const gastos: Gasto[] = [
      {
        id: 'g1',
        categoria: 'Asado',
        monto_total: 10000,
        aportes: [
          { persona_id: 'p1', monto: 4000 },
          { persona_id: 'p2', monto: 3000 },
          { persona_id: 'p3', monto: 3000 },
        ],
        participantes_ids: personas.map((p) => p.id),
      },
      {
        id: 'g2',
        categoria: 'Bebidas',
        monto_total: 5000,
        aportes: [{ persona_id: 'p4', monto: 5000 }],
        participantes_ids: ['p1', 'p2', 'p5', 'p6', 'p7', 'p8'],
      },
    ];

    const res = calcularLiquidacionMinimizada(personas, gastos);
    expect(res.transferencias.length).toBeLessThanOrEqual(personas.length - 1);
  });

  // 8. INVARIANTE: determinismo con orden alterado de gastos.
  it('8. INVARIANTE: determinismo estricto ante permutación del orden de gastos', () => {
    const personas: Persona[] = [pOrganizador, pJuan, pMatias, pPedro];
    const g1: Gasto = {
      id: 'g1',
      categoria: 'Asado',
      monto_total: 4000,
      aportes: [{ persona_id: 'p1', monto: 4000 }],
      participantes_ids: ['p1', 'p2', 'p3'],
    };
    const g2: Gasto = {
      id: 'g2',
      categoria: 'Bebidas',
      monto_total: 3000,
      aportes: [{ persona_id: 'p2', monto: 3000 }],
      participantes_ids: ['p2', 'p3', 'p4'],
    };
    const g3: Gasto = {
      id: 'g3',
      categoria: 'Otros',
      monto_total: 1500,
      aportes: [{ persona_id: 'p4', monto: 1500 }],
      participantes_ids: ['p1', 'p4'],
    };

    const res1 = calcularLiquidacionMinimizada(personas, [g1, g2, g3]);
    const res2 = calcularLiquidacionMinimizada(personas, [g3, g1, g2]);
    const res3 = calcularLiquidacionMinimizada(personas, [g2, g3, g1]);

    expect(res1.transferencias).toEqual(res2.transferencias);
    expect(res1.transferencias).toEqual(res3.transferencias);
    expect(res1.balances_individuales).toEqual(res2.balances_individuales);
  });

  // 9. Caso con montos primos: 7 personas, 3 acreedores.
  it('9. Caso con montos primos: 7 personas, 3 acreedores, todas las deudas se cierran exactamente', () => {
    const personas: Persona[] = Array.from({ length: 7 }, (_, i) => ({
      id: `p${i + 1}`,
      apodo: `Pibe${i + 1}`,
      es_organizador: i === 0,
    }));

    // Gasto con número primo 7129 consumido por todos
    const gastos: Gasto[] = [
      {
        id: 'g1',
        categoria: 'Asado',
        monto_total: 7129,
        aportes: [
          { persona_id: 'p1', monto: 3137 },
          { persona_id: 'p2', monto: 2003 },
          { persona_id: 'p3', monto: 1989 },
        ],
        participantes_ids: personas.map((p) => p.id),
      },
    ];

    const res = calcularLiquidacionMinimizada(personas, gastos);

    // Suma de balances = 0
    const sumaBalances = res.balances_individuales.reduce((acc, b) => acc + b.saldo, 0);
    expect(sumaBalances).toBe(0);

    // Suma transferencias = suma acreedores
    const sumaPositivos = res.balances_individuales
      .filter((b) => b.saldo > 0)
      .reduce((acc, b) => acc + b.saldo, 0);
    const sumaTransferencias = res.transferencias.reduce((acc, t) => acc + t.monto, 0);
    expect(sumaTransferencias).toBe(sumaPositivos);

    // Todos los deudores y acreedores quedan en 0
    const finalMap = new Map<string, number>();
    for (const b of res.balances_individuales) {
      finalMap.set(b.persona_id, b.saldo);
    }
    for (const t of res.transferencias) {
      finalMap.set(t.from_persona_id, finalMap.get(t.from_persona_id)! + t.monto);
      finalMap.set(t.to_persona_id, finalMap.get(t.to_persona_id)! - t.monto);
    }
    for (const saldo of finalMap.values()) {
      expect(saldo).toBe(0);
    }
  });

  // 10. Caso con organizador acreedor (el clásico: el organizador pagó todo).
  it('10. Caso organizador acreedor: organizador pagó todo, todos le transfieren directo a él', () => {
    const personas: Persona[] = [pOrganizador, pJuan, pMatias, pPedro];
    const gastos: Gasto[] = [
      {
        id: 'g1',
        categoria: 'Asado',
        monto_total: 10000,
        aportes: [{ persona_id: 'p1', monto: 10000 }],
        participantes_ids: ['p1', 'p2', 'p3', 'p4'],
      },
    ];

    const res = calcularLiquidacionMinimizada(personas, gastos);

    expect(res.transferencias).toHaveLength(3);
    for (const t of res.transferencias) {
      expect(t.to_persona_id).toBe('p1');
      expect(t.to_apodo).toBe('Marcos');
      expect(t.monto).toBe(2500);
    }
  });
});
