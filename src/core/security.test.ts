import { describe, expect, it, vi } from 'vitest';
import { generarId } from './security';

describe('Generador de Identificadores (generarId)', () => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('1. genera un identificador que cumple con el formato UUID v4', () => {
    const id = generarId();
    expect(id).toBeDefined();
    expect(id).toMatch(uuidRegex);
  });

  it('2. genera identificadores únicos en llamadas sucesivas', () => {
    const id1 = generarId();
    const id2 = generarId();
    expect(id1).not.toBe(id2);
  });

  it('3. ejecuta el fallback cuando crypto.randomUUID no está disponible', () => {
    const originalRandomUUID = crypto.randomUUID;
    try {
      // Simular contexto HTTP no seguro donde randomUUID no existe
      // @ts-expect-error simulación de ausencia de método
      crypto.randomUUID = undefined;

      const idFallback = generarId();
      expect(idFallback).toBeDefined();
      expect(idFallback).toMatch(uuidRegex);
    } finally {
      crypto.randomUUID = originalRandomUUID;
    }
  });
});
