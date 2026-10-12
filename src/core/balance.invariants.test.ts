import { describe, expect, it } from 'vitest';
import { calcularLiquidacionCentralizada } from './balance';
import { Gasto, Persona } from './types';

describe('Invariantes Matemáticos del Motor Financiero', () => {
  const personas5: Persona[] = [
    { id: 'p-org', juntada_id: 'j-inv', apodo: 'Joaco', es_organizador: true },
    { id: 'p-1', juntada_id: 'j-inv', apodo: 'Juan', es_organizador: false },
    { id: 'p-2', juntada_id: 'j-inv', apodo: 'Pedro', es_organizador: false },
    { id: 'p-3', juntada_id: 'j-inv', apodo: 'Nico', es_organizador: false },
    { id: 'p-4', juntada_id: 'j-inv', apodo: 'Lucas', es_organizador: false },
  ];

  const gastos4: Gasto[] = [
    {
      id: 'g-1',
      juntada_id: 'j-inv',
      categoria: 'Asado',
      monto_total: 45000,
      aportes: [
        { persona_id: 'p-org', monto: 25000 },
        { persona_id: 'p-1', monto: 20000 },
      ],
      participantes_ids: ['p-org', 'p-1', 'p-2', 'p-3', 'p-4'],
    },
    {
      id: 'g-2',
      juntada_id: 'j-inv',
      categoria: 'Bebidas',
      monto_total: 28000,
      aportes: [
        { persona_id: 'p-2', monto: 15000 },
        { persona_id: 'p-3', monto: 13000 },
      ],
      participantes_ids: ['p-org', 'p-1', 'p-2', 'p-3'],
    },
    {
      id: 'g-3',
      juntada_id: 'j-inv',
      categoria: 'Fútbol',
      monto_total: 15000,
      aportes: [{ persona_id: 'p-4', monto: 15000 }],
      participantes_ids: ['p-org', 'p-1', 'p-2', 'p-4'],
    },
    {
      id: 'g-4',
      juntada_id: 'j-inv',
      categoria: 'Otros',
      monto_total: 7500,
      aportes: [
        { persona_id: 'p-org', monto: 5000 },
        { persona_id: 'p-2', monto: 2500 },
      ],
      participantes_ids: ['p-3', 'p-4'],
    },
  ];

  // 1. INVARIANTE: suma algebraica de balances = 0
  it('1. INVARIANTE: suma algebraica de balances = 0', () => {
    const res = calcularLiquidacionCentralizada(personas5, gastos4, 'p-org');

    const sumaDeudores = res.bloqueA_deudores.reduce(
      (acc, d) => acc - d.monto_a_transferir,
      0
    );
    const sumaAcreedores = res.bloqueB_acreedores.reduce(
      (acc, a) => acc + a.monto_a_devolver,
      0
    );
    const saldoOrganizador = res.organizador.saldo_neto_calculado;

    const balanceAlgebraicoTotal = sumaDeudores + sumaAcreedores + saldoOrganizador;

    expect(balanceAlgebraicoTotal).toBe(0);
  });

  // 2. INVARIANTE: suma de créditos = suma de monto_total de gastos
  it('2. INVARIANTE: suma de créditos = suma de monto_total de gastos', () => {
    const totalAportes = gastos4.reduce(
      (total, g) => total + g.aportes.reduce((sum, a) => sum + a.monto, 0),
      0
    );
    const totalMontoGastos = gastos4.reduce((total, g) => total + g.monto_total, 0);

    expect(totalAportes).toBe(totalMontoGastos);

    const res = calcularLiquidacionCentralizada(personas5, gastos4, 'p-org');
    expect(res.totales.total_general).toBe(totalMontoGastos);
  });

  // 3. INVARIANTE: determinismo con orden alterado
  it('3. INVARIANTE: determinismo con orden alterado', () => {
    const resOrdenA = calcularLiquidacionCentralizada(personas5, gastos4, 'p-org');
    const resOrdenInvertido = calcularLiquidacionCentralizada(
      personas5,
      [...gastos4].reverse(),
      'p-org'
    );

    expect(resOrdenA).toEqual(resOrdenInvertido);
  });

  // 4. INVARIANTE: conservación de masa monetaria
  it('4. INVARIANTE: conservación de masa monetaria', () => {
    const res = calcularLiquidacionCentralizada(personas5, gastos4, 'p-org');

    const totalRecaudadoBloqueA = res.bloqueA_deudores.reduce(
      (acc, d) => acc + d.monto_a_transferir,
      0
    );
    const dineroOrganizadorDeBolsillo = res.organizador.debe_poner_de_su_bolsillo
      ? res.organizador.monto_a_poner_de_bolsillo
      : 0;

    const totalDevolverBloqueB = res.bloqueB_acreedores.reduce(
      (acc, a) => acc + a.monto_a_devolver,
      0
    );
    const dineroOrganizadorCobra = !res.organizador.debe_poner_de_su_bolsillo
      ? res.organizador.saldo_neto_calculado
      : 0;

    expect(totalRecaudadoBloqueA + dineroOrganizadorDeBolsillo).toBe(
      totalDevolverBloqueB + dineroOrganizadorCobra
    );
  });

  // 5. División $1.000 entre 7 personas
  it('5. División $1.000 entre 7 personas (pagado por el organizador, todos participan)', () => {
    const personas7: Persona[] = [
      { id: 'p-org', juntada_id: 'j-7', apodo: 'Org', es_organizador: true },
      { id: 'p-1', juntada_id: 'j-7', apodo: 'Invitado 1', es_organizador: false },
      { id: 'p-2', juntada_id: 'j-7', apodo: 'Invitado 2', es_organizador: false },
      { id: 'p-3', juntada_id: 'j-7', apodo: 'Invitado 3', es_organizador: false },
      { id: 'p-4', juntada_id: 'j-7', apodo: 'Invitado 4', es_organizador: false },
      { id: 'p-5', juntada_id: 'j-7', apodo: 'Invitado 5', es_organizador: false },
      { id: 'p-6', juntada_id: 'j-7', apodo: 'Invitado 6', es_organizador: false },
    ];

    const gastos: Gasto[] = [
      {
        id: 'g-7',
        juntada_id: 'j-7',
        categoria: 'Asado',
        monto_total: 1000,
        aportes: [{ persona_id: 'p-org', monto: 1000 }],
        participantes_ids: personas7.map((p) => p.id),
      },
    ];

    const res = calcularLiquidacionCentralizada(personas7, gastos, 'p-org');

    // Cada uno de los 6 invitados debe 1000 / 7 = 142.857... que redondea a $143
    expect(res.bloqueA_deudores).toHaveLength(6);
    res.bloqueA_deudores.forEach((deudor) => {
      expect(deudor.monto_a_transferir).toBe(143);
    });

    // 6 invitados x $143 = $858 recaudados
    const totalRecaudadoInvitados = 6 * 143;
    expect(totalRecaudadoInvitados).toBe(858);
    expect(res.organizador.saldo_neto_calculado).toBe(858);

    // Lo que queda a cargo del organizador (pagó 1000 - 858 que cobra = $142)
    const costoFinalOrganizador = 1000 - res.organizador.saldo_neto_calculado;
    expect(costoFinalOrganizador).toBe(142);

    // 6 invitados x $143 + $142 del organizador = $1.000 exactos
    expect(totalRecaudadoInvitados + costoFinalOrganizador).toBe(1000);
  });

  // 6. División $10.000 entre 11 personas
  it('6. División $10.000 entre 11 personas (pagado por el organizador, todos participan)', () => {
    const personas11: Persona[] = [
      { id: 'p-org', juntada_id: 'j-11', apodo: 'Org', es_organizador: true },
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `p-${i + 1}`,
        juntada_id: 'j-11',
        apodo: `Invitado ${i + 1}`,
        es_organizador: false,
      })),
    ];

    const gastos: Gasto[] = [
      {
        id: 'g-11',
        juntada_id: 'j-11',
        categoria: 'Asado',
        monto_total: 10000,
        aportes: [{ persona_id: 'p-org', monto: 10000 }],
        participantes_ids: personas11.map((p) => p.id),
      },
    ];

    const res = calcularLiquidacionCentralizada(personas11, gastos, 'p-org');

    // Cada uno de los 10 invitados debe 10000 / 11 = 909.090... que redondea a $909
    expect(res.bloqueA_deudores).toHaveLength(10);
    res.bloqueA_deudores.forEach((deudor) => {
      expect(deudor.monto_a_transferir).toBe(909);
    });

    // 10 invitados x $909 = $9.090 recaudados
    const totalRecaudadoInvitados = 10 * 909;
    expect(totalRecaudadoInvitados).toBe(9090);
    expect(res.organizador.saldo_neto_calculado).toBe(9090);

    // Lo que queda a cargo del organizador (pagó 10000 - 9090 que cobra = $910)
    const costoFinalOrganizador = 10000 - res.organizador.saldo_neto_calculado;
    expect(costoFinalOrganizador).toBe(910);

    // 10 invitados x $909 + $910 del organizador = $10.000 exactos
    expect(totalRecaudadoInvitados + costoFinalOrganizador).toBe(10000);
  });

  // 7. ERROR: monto_total inconsistente
  it('7. ERROR: monto_total inconsistente con la suma de aportes', () => {
    const gastoInconsistente: Gasto = {
      id: 'g-error',
      juntada_id: 'j-inv',
      categoria: 'Asado',
      monto_total: 50000,
      aportes: [{ persona_id: 'p-org', monto: 30000 }], // faltan 20000
      participantes_ids: ['p-org', 'p-1'],
    };

    expect(() =>
      calcularLiquidacionCentralizada(personas5, [gastoInconsistente], 'p-org')
    ).toThrowError(
      'Gasto g-error: monto_total (50000) no coincide con la suma de aportes (30000)'
    );
  });
});
