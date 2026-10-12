import { Juntada } from './types';

export interface ValidacionReglaResultado {
  ok: boolean;
  motivo?: string;
}

/**
 * Determina si es seguro y válido eliminar una persona de la juntada.
 *
 * Reglas:
 * 1. No se puede eliminar a una persona inexistente.
 * 2. No se puede eliminar al organizador de la juntada.
 * 3. No se puede eliminar si es la última persona que queda en la juntada.
 * 4. No se puede eliminar si aportó dinero en algún gasto existente.
 * 5. No se puede eliminar si figura como participante (consumidor) en algún gasto existente.
 */
export function puedeBorrarPersona(
  j: Juntada,
  personaId: string
): ValidacionReglaResultado {
  const persona = j.personas.find((p) => p.id === personaId);
  if (!persona) {
    return { ok: false, motivo: 'La persona indicada no existe en la juntada.' };
  }

  if (persona.es_organizador || j.organizador_id === personaId) {
    return { ok: false, motivo: 'No se puede eliminar al organizador de la juntada.' };
  }

  if (j.personas.length <= 1) {
    return {
      ok: false,
      motivo: 'No se puede eliminar la única persona de la juntada.',
    };
  }

  // Verificar si aportó en algún gasto
  const aportoEnGasto = j.gastos.some((g) =>
    g.aportes.some((a) => a.persona_id === personaId)
  );
  if (aportoEnGasto) {
    return {
      ok: false,
      motivo: 'No se puede eliminar una persona que aportó en algún gasto.',
    };
  }

  // Verificar si participó en algún gasto
  const participoEnGasto = j.gastos.some((g) =>
    g.participantes_ids.includes(personaId)
  );
  if (participoEnGasto) {
    return {
      ok: false,
      motivo: 'No se puede eliminar una persona que participó en algún gasto.',
    };
  }

  return { ok: true };
}

/**
 * Determina si es válido eliminar un gasto de la juntada.
 *
 * Reglas:
 * 1. No se puede eliminar un gasto si la juntada está cerrada (cuentas congeladas).
 * 2. Si la juntada está abierta, se puede eliminar libremente.
 */
export function puedeBorrarGasto(j: Juntada): ValidacionReglaResultado {
  if (j.estado === 'cerrada') {
    return {
      ok: false,
      motivo: 'No se puede eliminar un gasto si la juntada está cerrada.',
    };
  }

  return { ok: true };
}
