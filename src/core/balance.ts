import {
  CategoriaGasto,
  Gasto,
  LiquidacionResultado,
  OrganizadorBalance,
  Persona,
} from './types';

/**
 * Calcula la liquidación centralizada de una juntada con múltiples aportantes por gasto.
 *
 * Criterio financiero:
 * 1. Crédito por persona = suma de todos sus aportes monetarios en todos los gastos.
 * 2. Débito por persona = suma de (monto_total_gasto / cantidad_participantes) por cada gasto en el que participa.
 * 3. Balance exacto = Crédito - Débito.
 * 4. Redondeo: Cada invitado (no organizador) se redondea al entero más cercano ($ ARS).
 *    - Si balance < 0: Deudor -> Bloque A (transfiere al alias del organizador).
 *    - Si balance > 0: Acreedor -> Bloque B (el organizador le devuelve).
 * 5. Nodo Central (Organizador):
 *    - Recauda todo el Bloque A y paga todo el Bloque B.
 *    - Saldo neto final del organizador = Total Recaudado (Bloque A) - Total a Devolver (Bloque B).
 *    - La diferencia acumulada por redondeo queda absorbida en dicho saldo del organizador.
 */
export function calcularLiquidacionCentralizada(
  personas: Persona[],
  gastos: Gasto[],
  organizadorId: string
): LiquidacionResultado {
  const organizador = personas.find((p) => p.id === organizadorId);
  if (!organizador) {
    throw new Error('No se encontró al organizador en la lista de personas');
  }

  // Inicializar acumuladores por persona
  const creditos: Record<string, number> = {};
  const debitos: Record<string, number> = {};

  for (const p of personas) {
    creditos[p.id] = 0;
    debitos[p.id] = 0;
  }

  const totalesPorCategoria: Record<CategoriaGasto, number> = {
    Fútbol: 0,
    Asado: 0,
    Bebidas: 0,
    Otros: 0,
  };

  let totalGeneral = 0;

  for (const gasto of gastos) {
    // Suma efectiva de aportes del gasto
    const sumaAportes = gasto.aportes.reduce((sum, a) => sum + a.monto, 0);
    if (gasto.monto_total !== sumaAportes) {
      throw new Error(
        `Gasto ${gasto.id}: monto_total (${gasto.monto_total}) no coincide con la suma de aportes (${sumaAportes})`
      );
    }
    const montoGasto = sumaAportes;

    totalGeneral += montoGasto;
    totalesPorCategoria[gasto.categoria] =
      (totalesPorCategoria[gasto.categoria] || 0) + montoGasto;

    // Acreditar aportes individuales
    for (const aporte of gasto.aportes) {
      if (creditos[aporte.persona_id] !== undefined) {
        creditos[aporte.persona_id] += aporte.monto;
      }
    }

    // Debitar entre los participantes que consumieron el gasto
    const cantParticipantes = gasto.participantes_ids.length;
    if (cantParticipantes > 0) {
      const cuotaIndividual = montoGasto / cantParticipantes;
      for (const participanteId of gasto.participantes_ids) {
        if (debitos[participanteId] !== undefined) {
          debitos[participanteId] += cuotaIndividual;
        }
      }
    }
  }

  // Calcular balances de los invitados (excluyendo al organizador)
  const bloqueA_deudores = [];
  const bloqueB_acreedores = [];

  let totalRecaudadoBloqueA = 0;
  let totalADevolverBloqueB = 0;

  const invitados = personas.filter((p) => p.id !== organizadorId);

  for (const invitado of invitados) {
    const cred = creditos[invitado.id] || 0;
    const deb = debitos[invitado.id] || 0;
    const balanceExacto = cred - deb;

    const balanceRedondeado = Math.round(balanceExacto);

    if (balanceRedondeado < 0) {
      const montoATransferir = Math.abs(balanceRedondeado);
      bloqueA_deudores.push({
        persona_id: invitado.id,
        apodo: invitado.apodo,
        monto_a_transferir: montoATransferir,
      });
      totalRecaudadoBloqueA += montoATransferir;
    } else if (balanceRedondeado > 0) {
      const montoADevolver = balanceRedondeado;
      bloqueB_acreedores.push({
        persona_id: invitado.id,
        apodo: invitado.apodo,
        monto_a_devolver: montoADevolver,
      });
      totalADevolverBloqueB += montoADevolver;
    }
  }

  // Ordenar alfabéticamente por apodo para consistencia
  bloqueA_deudores.sort((a, b) => a.apodo.localeCompare(b.apodo));
  bloqueB_acreedores.sort((a, b) => a.apodo.localeCompare(b.apodo));

  // Liquidación del Organizador (nodo central)
  const balanceExactoOrganizador =
    (creditos[organizadorId] || 0) - (debitos[organizadorId] || 0);

  // El saldo neto final en mano del organizador surge de lo que entra por Bloque A menos lo que sale por Bloque B
  const saldoNetoOrganizador = totalRecaudadoBloqueA - totalADevolverBloqueB;

  // El residuo de redondeo absorbido es la diferencia entre el saldo neto final y el redondeo teórico
  const redondeoTeoricoOrganizador = Math.round(balanceExactoOrganizador);
  const residuoRedondeo = saldoNetoOrganizador - redondeoTeoricoOrganizador;

  const debePonerDeBolsillo = saldoNetoOrganizador < 0;
  const montoAPoner = debePonerDeBolsillo ? Math.abs(saldoNetoOrganizador) : 0;

  const organizadorResultado: OrganizadorBalance = {
    persona_id: organizador.id,
    apodo: organizador.apodo,
    saldo_neto_calculado: saldoNetoOrganizador,
    debe_poner_de_su_bolsillo: debePonerDeBolsillo,
    monto_a_poner_de_bolsillo: montoAPoner,
    residuo_redondeo_absorbido: residuoRedondeo,
  };

  return {
    bloqueA_deudores,
    bloqueB_acreedores,
    organizador: organizadorResultado,
    totales: {
      total_general: Math.round(totalGeneral),
      por_categoria: totalesPorCategoria,
    },
  };
}

export interface Transferencia {
  from_persona_id: string;
  from_apodo: string;
  to_persona_id: string;
  to_apodo: string;
  monto: number; // entero, positivo
}

export interface LiquidacionMinimizada {
  transferencias: Transferencia[];
  balances_individuales: Array<{
    persona_id: string;
    apodo: string;
    es_organizador: boolean;
    saldo: number; // positivo = le deben, negativo = debe
  }>;
  totales: {
    total_general: number;
    por_categoria: Record<CategoriaGasto, number>;
  };
}

/**
 * Algoritmo de minimización de transferencias P2P.
 * Resuelve deudas directamente entre deudores y acreedores (Greedy),
 * garantizando a lo sumo N - 1 transferencias directas.
 */
export function calcularLiquidacionMinimizada(
  personas: Persona[],
  gastos: Gasto[]
): LiquidacionMinimizada {
  // Inicializar acumuladores por persona
  const creditos: Record<string, number> = {};
  const debitos: Record<string, number> = {};

  for (const p of personas) {
    creditos[p.id] = 0;
    debitos[p.id] = 0;
  }

  const totalesPorCategoria: Record<CategoriaGasto, number> = {
    Fútbol: 0,
    Asado: 0,
    Bebidas: 0,
    Otros: 0,
  };

  let totalGeneral = 0;

  for (const gasto of gastos) {
    const sumaAportes = gasto.aportes.reduce((sum, a) => sum + a.monto, 0);
    if (gasto.monto_total !== sumaAportes) {
      throw new Error(
        `Gasto ${gasto.id}: monto_total (${gasto.monto_total}) no coincide con la suma de aportes (${sumaAportes})`
      );
    }
    const montoGasto = sumaAportes;

    totalGeneral += montoGasto;
    totalesPorCategoria[gasto.categoria] =
      (totalesPorCategoria[gasto.categoria] || 0) + montoGasto;

    // Acreditar aportes individuales
    for (const aporte of gasto.aportes) {
      if (creditos[aporte.persona_id] !== undefined) {
        creditos[aporte.persona_id] += aporte.monto;
      }
    }

    // Debitar entre los participantes que consumieron el gasto
    const cantParticipantes = gasto.participantes_ids.length;
    if (cantParticipantes > 0) {
      const cuotaIndividual = montoGasto / cantParticipantes;
      for (const participanteId of gasto.participantes_ids) {
        if (debitos[participanteId] !== undefined) {
          debitos[participanteId] += cuotaIndividual;
        }
      }
    }
  }

  // Balances netos preliminares y redondeo al entero más cercano
  const balancesPreliminares = personas.map((p) => {
    const cred = creditos[p.id] || 0;
    const deb = debitos[p.id] || 0;
    const balanceExacto = cred - deb;
    return {
      persona_id: p.id,
      apodo: p.apodo,
      es_organizador: !!p.es_organizador,
      saldo: Math.round(balanceExacto),
    };
  });

  // Ajustar cualquier residuo de redondeo al organizador para que la suma total sea 0
  const sumaSaldos = balancesPreliminares.reduce((sum, b) => sum + b.saldo, 0);
  if (sumaSaldos !== 0) {
    const orgIndex = balancesPreliminares.findIndex((b) => b.es_organizador);
    const targetIndex = orgIndex !== -1 ? orgIndex : 0;
    if (balancesPreliminares[targetIndex]) {
      balancesPreliminares[targetIndex].saldo -= sumaSaldos;
    }
  }

  // Deudores (< 0) y acreedores (> 0)
  interface DeudorTemp {
    persona_id: string;
    apodo: string;
    deuda: number;
  }
  interface AcreedorTemp {
    persona_id: string;
    apodo: string;
    credito: number;
  }

  const deudores: DeudorTemp[] = balancesPreliminares
    .filter((b) => b.saldo < 0)
    .map((b) => ({
      persona_id: b.persona_id,
      apodo: b.apodo,
      deuda: Math.abs(b.saldo),
    }))
    .sort(
      (a, b) =>
        b.deuda - a.deuda ||
        a.apodo.localeCompare(b.apodo) ||
        a.persona_id.localeCompare(b.persona_id)
    );

  const acreedores: AcreedorTemp[] = balancesPreliminares
    .filter((b) => b.saldo > 0)
    .map((b) => ({
      persona_id: b.persona_id,
      apodo: b.apodo,
      credito: b.saldo,
    }))
    .sort(
      (a, b) =>
        b.credito - a.credito ||
        a.apodo.localeCompare(b.apodo) ||
        a.persona_id.localeCompare(b.persona_id)
    );

  // Algoritmo Greedy para minimizar transferencias
  const transferencias: Transferencia[] = [];
  let i = 0;
  let j = 0;

  while (i < deudores.length && j < acreedores.length) {
    const deudor = deudores[i];
    const acreedor = acreedores[j];

    const monto = Math.min(deudor.deuda, acreedor.credito);
    if (monto > 0) {
      transferencias.push({
        from_persona_id: deudor.persona_id,
        from_apodo: deudor.apodo,
        to_persona_id: acreedor.persona_id,
        to_apodo: acreedor.apodo,
        monto,
      });

      deudor.deuda -= monto;
      acreedor.credito -= monto;
    }

    if (deudor.deuda === 0) {
      i++;
    }
    if (acreedor.credito === 0) {
      j++;
    }
  }

  return {
    transferencias,
    balances_individuales: balancesPreliminares,
    totales: {
      total_general: Math.round(totalGeneral),
      por_categoria: totalesPorCategoria,
    },
  };
}
