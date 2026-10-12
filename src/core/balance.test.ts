import { describe, expect, it } from 'vitest';
import { calcularLiquidacionCentralizada } from './balance';
import { Gasto, Persona } from './types';

describe('Motor Financiero - calcularLiquidacionCentralizada', () => {
  const org: Persona = { id: 'p-org', juntada_id: 'j-1', apodo: 'Joaco', es_organizador: true };
  const juan: Persona = { id: 'p-juan', juntada_id: 'j-1', apodo: 'Juan', es_organizador: false };
  const pedro: Persona = { id: 'p-pedro', juntada_id: 'j-1', apodo: 'Pedro', es_organizador: false };
  const nico: Persona = { id: 'p-nico', juntada_id: 'j-1', apodo: 'Nico', es_organizador: false };

  // Caso 1: Un gasto con un solo aportante, todos participan
  it('1. Un gasto con un solo aportante, todos participan', () => {
    const personas = [org, juan, pedro];
    const gastos: Gasto[] = [
      {
        id: 'g-1',
        juntada_id: 'j-1',
        categoria: 'Asado',
        monto_total: 30000,
        aportes: [{ persona_id: org.id, monto: 30000 }],
        participantes_ids: [org.id, juan.id, pedro.id],
      },
    ];

    const res = calcularLiquidacionCentralizada(personas, gastos, org.id);

    // Cada uno consume 10000. Org puso 30000 -> saldo +20000. Juan y Pedro deben 10000 cada uno.
    expect(res.bloqueA_deudores).toEqual([
      { persona_id: juan.id, apodo: 'Juan', monto_a_transferir: 10000 },
      { persona_id: pedro.id, apodo: 'Pedro', monto_a_transferir: 10000 },
    ]);
    expect(res.bloqueB_acreedores).toEqual([]);
    expect(res.organizador.saldo_neto_calculado).toBe(20000);
    expect(res.organizador.debe_poner_de_su_bolsillo).toBe(false);
    expect(res.totales.total_general).toBe(30000);
    expect(res.totales.por_categoria.Asado).toBe(30000);
  });

  // Caso 2: Un gasto con múltiples aportantes, todos participan
  it('2. Un gasto con múltiples aportantes, todos participan', () => {
    const personas = [org, juan, pedro];
    // Gasto de 30000: Juan puso 20000, Pedro puso 10000, Org no puso nada
    // Cada uno consume 10000
    const gastos: Gasto[] = [
      {
        id: 'g-1',
        juntada_id: 'j-1',
        categoria: 'Asado',
        monto_total: 30000,
        aportes: [
          { persona_id: juan.id, monto: 20000 },
          { persona_id: pedro.id, monto: 10000 },
        ],
        participantes_ids: [org.id, juan.id, pedro.id],
      },
    ];

    const res = calcularLiquidacionCentralizada(personas, gastos, org.id);

    // Pedro: puso 10000, consumió 10000 -> balance 0 (no aparece)
    // Juan: puso 20000, consumió 10000 -> balance +10000 -> Bloque B (se le devuelve)
    // Org: puso 0, consumió 10000 -> debe 10000 de su bolsillo
    expect(res.bloqueA_deudores).toEqual([]);
    expect(res.bloqueB_acreedores).toEqual([
      { persona_id: juan.id, apodo: 'Juan', monto_a_devolver: 10000 },
    ]);
    expect(res.organizador.saldo_neto_calculado).toBe(-10000);
    expect(res.organizador.debe_poner_de_su_bolsillo).toBe(true);
    expect(res.organizador.monto_a_poner_de_bolsillo).toBe(10000);
  });

  // Caso 3: Un gasto con aportante que no participa (crédito sin débito)
  it('3. Un gasto con aportante que no participa (crédito sin débito)', () => {
    const personas = [org, juan, pedro];
    // Pedro compra carne por 15000 pero no come (solo comen Org y Juan)
    const gastos: Gasto[] = [
      {
        id: 'g-1',
        juntada_id: 'j-1',
        categoria: 'Asado',
        monto_total: 15000,
        aportes: [{ persona_id: pedro.id, monto: 15000 }],
        participantes_ids: [org.id, juan.id],
      },
    ];

    const res = calcularLiquidacionCentralizada(personas, gastos, org.id);

    // Consumo por cabeza de Org y Juan: 7500 cada uno.
    // Pedro: crédito 15000, débito 0 -> +15000 en Bloque B
    // Juan: crédito 0, débito 7500 -> 7500 en Bloque A
    // Org: crédito 0, débito 7500 -> recauda 7500 de Juan y debe poner 7500 para pagarle a Pedro los 15000
    expect(res.bloqueA_deudores).toEqual([
      { persona_id: juan.id, apodo: 'Juan', monto_a_transferir: 7500 },
    ]);
    expect(res.bloqueB_acreedores).toEqual([
      { persona_id: pedro.id, apodo: 'Pedro', monto_a_devolver: 15000 },
    ]);
    expect(res.organizador.saldo_neto_calculado).toBe(-7500);
    expect(res.organizador.debe_poner_de_su_bolsillo).toBe(true);
    expect(res.organizador.monto_a_poner_de_bolsillo).toBe(7500);
  });

  // Caso 4: Un gasto con participante que no aportó (débito sin crédito)
  it('4. Un gasto con participante que no aportó (débito sin crédito)', () => {
    const personas = [org, juan];
    // Org paga 10000, consumen ambos. Juan no aportó un peso
    const gastos: Gasto[] = [
      {
        id: 'g-1',
        juntada_id: 'j-1',
        categoria: 'Bebidas',
        monto_total: 10000,
        aportes: [{ persona_id: org.id, monto: 10000 }],
        participantes_ids: [org.id, juan.id],
      },
    ];

    const res = calcularLiquidacionCentralizada(personas, gastos, org.id);

    expect(res.bloqueA_deudores).toEqual([
      { persona_id: juan.id, apodo: 'Juan', monto_a_transferir: 5000 },
    ]);
    expect(res.bloqueB_acreedores).toEqual([]);
    expect(res.organizador.saldo_neto_calculado).toBe(5000);
    expect(res.organizador.debe_poner_de_su_bolsillo).toBe(false);
  });

  // Caso 5: Varios gastos, varios aportantes, varios participantes, mezcla
  it('5. Varios gastos, varios aportantes, varios participantes, mezcla', () => {
    const personas = [org, juan, pedro, nico];
    const gastos: Gasto[] = [
      // Gasto 1: Fútbol $20000 (pagó Org $10000 y Nico $10000), juegan los 4 ($5000 c/u)
      {
        id: 'g-1',
        juntada_id: 'j-1',
        categoria: 'Fútbol',
        monto_total: 20000,
        aportes: [
          { persona_id: org.id, monto: 10000 },
          { persona_id: nico.id, monto: 10000 },
        ],
        participantes_ids: [org.id, juan.id, pedro.id, nico.id],
      },
      // Gasto 2: Asado $40000 (pagó Juan $40000), comen Org, Juan, Pedro ($13333.33 c/u)
      {
        id: 'g-2',
        juntada_id: 'j-1',
        categoria: 'Asado',
        monto_total: 40000,
        aportes: [{ persona_id: juan.id, monto: 40000 }],
        participantes_ids: [org.id, juan.id, pedro.id],
      },
      // Gasto 3: Bebidas $10000 (pagó Pedro $10000), toman Juan, Pedro, Nico ($3333.33 c/u)
      {
        id: 'g-3',
        juntada_id: 'j-1',
        categoria: 'Bebidas',
        monto_total: 10000,
        aportes: [{ persona_id: pedro.id, monto: 10000 }],
        participantes_ids: [juan.id, pedro.id, nico.id],
      },
    ];

    const res = calcularLiquidacionCentralizada(personas, gastos, org.id);

    // Totales gastados: 20000 + 40000 + 10000 = 70000
    expect(res.totales.total_general).toBe(70000);
    expect(res.totales.por_categoria.Fútbol).toBe(20000);
    expect(res.totales.por_categoria.Asado).toBe(40000);
    expect(res.totales.por_categoria.Bebidas).toBe(10000);

    // Suma de recaudado Bloque A + dinero que pone Org = devuelto Bloque B
    const totalRecaudado = res.bloqueA_deudores.reduce((acc, d) => acc + d.monto_a_transferir, 0);
    const totalDevolver = res.bloqueB_acreedores.reduce((acc, a) => acc + a.monto_a_devolver, 0);
    const dineroOrgBolsillo = res.organizador.debe_poner_de_su_bolsillo
      ? res.organizador.monto_a_poner_de_bolsillo
      : 0;
    const dineroOrgCobra = !res.organizador.debe_poner_de_su_bolsillo
      ? res.organizador.saldo_neto_calculado
      : 0;

    // Balance monetario cerrado: Recaudado + BolsilloOrg = Devuelto + CobroOrg
    expect(totalRecaudado + dineroOrgBolsillo).toBe(totalDevolver + dineroOrgCobra);
  });

  // Caso 6: División con residuo de redondeo: verificar que el residuo se imputa al organizador
  it('6. División con residuo de redondeo: verificar que el residuo se imputa al organizador', () => {
    const personas = [org, juan, pedro];
    // Gasto de $100 pagado por Org entre los 3
    // Cada uno debe 33.3333...
    // Juan redondea a 33 (Bloque A)
    // Pedro redondea a 33 (Bloque A)
    // Total recaudado por Org = 66
    // Org exacto: 100 - 33.3333... = +66.6666... (redondeo teórico = 67)
    // Saldo real que le queda a Org = 66
    // Residuo absorbido por Org = 66 - 67 = -1
    const gastos: Gasto[] = [
      {
        id: 'g-1',
        juntada_id: 'j-1',
        categoria: 'Otros',
        monto_total: 100,
        aportes: [{ persona_id: org.id, monto: 100 }],
        participantes_ids: [org.id, juan.id, pedro.id],
      },
    ];

    const res = calcularLiquidacionCentralizada(personas, gastos, org.id);

    expect(res.bloqueA_deudores).toEqual([
      { persona_id: juan.id, apodo: 'Juan', monto_a_transferir: 33 },
      { persona_id: pedro.id, apodo: 'Pedro', monto_a_transferir: 33 },
    ]);
    expect(res.bloqueB_acreedores).toEqual([]);
    expect(res.organizador.saldo_neto_calculado).toBe(66);
    expect(res.organizador.residuo_redondeo_absorbido).toBe(-1);

    // Suma total que pagó cada uno: Juan 33 + Pedro 33 + Org (100 - 66 = 34) = 100
    const gastoRealOrg = 100 - res.organizador.saldo_neto_calculado;
    expect(33 + 33 + gastoRealOrg).toBe(100);
  });

  // Caso 7: Organizador con saldo a favor
  it('7. Organizador con saldo a favor', () => {
    const personas = [org, juan];
    // Org paga 20000, comen los 2. Juan le debe 10000. Org tiene saldo a favor de 10000
    const gastos: Gasto[] = [
      {
        id: 'g-1',
        juntada_id: 'j-1',
        categoria: 'Asado',
        monto_total: 20000,
        aportes: [{ persona_id: org.id, monto: 20000 }],
        participantes_ids: [org.id, juan.id],
      },
    ];

    const res = calcularLiquidacionCentralizada(personas, gastos, org.id);

    expect(res.organizador.saldo_neto_calculado).toBe(10000);
    expect(res.organizador.debe_poner_de_su_bolsillo).toBe(false);
    expect(res.organizador.monto_a_poner_de_bolsillo).toBe(0);
    expect(res.bloqueA_deudores).toHaveLength(1);
    expect(res.bloqueB_acreedores).toHaveLength(0);
  });

  // Caso 8: Organizador con saldo en contra
  it('8. Organizador con saldo en contra', () => {
    const personas = [org, juan];
    // Juan paga 20000, comen los 2. Org le debe 10000 a Juan
    const gastos: Gasto[] = [
      {
        id: 'g-1',
        juntada_id: 'j-1',
        categoria: 'Asado',
        monto_total: 20000,
        aportes: [{ persona_id: juan.id, monto: 20000 }],
        participantes_ids: [org.id, juan.id],
      },
    ];

    const res = calcularLiquidacionCentralizada(personas, gastos, org.id);

    expect(res.organizador.saldo_neto_calculado).toBe(-10000);
    expect(res.organizador.debe_poner_de_su_bolsillo).toBe(true);
    expect(res.organizador.monto_a_poner_de_bolsillo).toBe(10000);
    expect(res.bloqueA_deudores).toHaveLength(0);
    expect(res.bloqueB_acreedores).toEqual([
      { persona_id: juan.id, apodo: 'Juan', monto_a_devolver: 10000 },
    ]);
  });

  // Caso 9: Todos los participantes con saldo cero
  it('9. Todos los participantes con saldo cero', () => {
    const personas = [org, juan];
    // Cada uno pagó exactamente su propio consumo (10000 cada uno)
    const gastos: Gasto[] = [
      {
        id: 'g-1',
        juntada_id: 'j-1',
        categoria: 'Bebidas',
        monto_total: 20000,
        aportes: [
          { persona_id: org.id, monto: 10000 },
          { persona_id: juan.id, monto: 10000 },
        ],
        participantes_ids: [org.id, juan.id],
      },
    ];

    const res = calcularLiquidacionCentralizada(personas, gastos, org.id);

    expect(res.bloqueA_deudores).toEqual([]);
    expect(res.bloqueB_acreedores).toEqual([]);
    expect(res.organizador.saldo_neto_calculado).toBe(0);
    expect(res.organizador.debe_poner_de_su_bolsillo).toBe(false);
    expect(res.organizador.monto_a_poner_de_bolsillo).toBe(0);
  });
});
