import { CategoriaGasto, Juntada } from './types';

export const STORAGE_KEY = 'juntadita:juntada-activa';

export interface JuntadaExportPayload {
  version: number;
  exported_at: string;
  juntada: Juntada;
}

/**
 * Sanitiza el nombre de la juntada para el archivo de exportación.
 * Reemplaza caracteres no alfanuméricos por guiones, convierte a minúsculas y trunca a 30 caracteres.
 * Ejemplo: "Asado del Viernes!!!" -> "asado-del-viernes"
 */
export function sanitizarNombreArchivo(nombre: string): string {
  const sanitizado = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remover acentos
    .replace(/[^a-z0-9]+/g, '-') // reemplazar no alfanuméricos por guión
    .replace(/^-+|-+$/g, '') // eliminar guiones en extremos
    .slice(0, 30)
    .replace(/-+$/, ''); // eliminar guión residual al final tras el truncado

  return sanitizado || 'juntada';
}

/**
 * Validador estricto del esquema de Juntada.
 * Comprueba integridad referencial, tipos, consistencia de montos y unicidad de roles.
 */
export function validarEsquemaJuntada(data: unknown): Juntada {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('Estructura de datos inválida: se esperaba un objeto.');
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.id !== 'string' || obj.id.trim() === '') {
    throw new Error('Campo "id" inválido o vacío en la juntada.');
  }

  if (typeof obj.nombre !== 'string' || obj.nombre.trim() === '') {
    throw new Error('Campo "nombre" inválido o vacío en la juntada.');
  }

  if (typeof obj.alias_cobro !== 'string' || obj.alias_cobro.trim() === '') {
    throw new Error('Campo "alias_cobro" inválido o vacío en la juntada.');
  }

  if (obj.estado !== 'abierta' && obj.estado !== 'cerrada') {
    throw new Error('Campo "estado" inválido: debe ser "abierta" o "cerrada".');
  }

  if (!Array.isArray(obj.personas) || obj.personas.length === 0) {
    throw new Error('Campo "personas" inválido: debe contener al menos una persona.');
  }

  const personaIds = new Set<string>();
  let organizadoresCount = 0;
  let organizadorPersonaId = '';

  for (let i = 0; i < obj.personas.length; i++) {
    const p = obj.personas[i];
    if (typeof p !== 'object' || p === null) {
      throw new Error(`Persona en índice ${i} no es un objeto válido.`);
    }

    const personaObj = p as Record<string, unknown>;
    if (typeof personaObj.id !== 'string' || personaObj.id.trim() === '') {
      throw new Error(`Persona en índice ${i} tiene un "id" inválido o vacío.`);
    }
    if (typeof personaObj.apodo !== 'string' || personaObj.apodo.trim() === '') {
      throw new Error(`Persona en índice ${i} tiene un "apodo" inválido o vacío.`);
    }
    if (typeof personaObj.es_organizador !== 'boolean') {
      throw new Error(`Persona en índice ${i} tiene un "es_organizador" no booleano.`);
    }
    if (personaObj.alias_cobro !== undefined) {
      if (
        typeof personaObj.alias_cobro !== 'string' ||
        personaObj.alias_cobro.trim() === '' ||
        personaObj.alias_cobro.trim().length > 60
      ) {
        throw new Error(
          `Persona en índice ${i} tiene un "alias_cobro" inválido (debe ser string no vacío de máx 60 caracteres).`
        );
      }
    }

    if (personaIds.has(personaObj.id)) {
      throw new Error(`Identificador duplicado para la persona "${personaObj.apodo}".`);
    }
    personaIds.add(personaObj.id);

    if (personaObj.es_organizador) {
      organizadoresCount++;
      organizadorPersonaId = personaObj.id;
    }
  }

  if (organizadoresCount !== 1) {
    throw new Error(
      `Debe existir exactamente un organizador en la juntada (se encontraron ${organizadoresCount}).`
    );
  }

  if (
    typeof obj.organizador_id !== 'string' ||
    obj.organizador_id !== organizadorPersonaId
  ) {
    throw new Error(
      'El campo organizador_id no coincide con el identificador del organizador designado.'
    );
  }

  if (!Array.isArray(obj.gastos)) {
    throw new Error('Campo "gastos" inválido: debe ser un array.');
  }

  const categoriasValidas: CategoriaGasto[] = ['Fútbol', 'Asado', 'Bebidas', 'Otros'];

  for (let i = 0; i < obj.gastos.length; i++) {
    const g = obj.gastos[i];
    if (typeof g !== 'object' || g === null) {
      throw new Error(`Gasto en índice ${i} no es un objeto válido.`);
    }

    const gastoObj = g as Record<string, unknown>;
    if (typeof gastoObj.id !== 'string' || gastoObj.id.trim() === '') {
      throw new Error(`Gasto en índice ${i} tiene un "id" inválido o vacío.`);
    }

    if (!categoriasValidas.includes(gastoObj.categoria as CategoriaGasto)) {
      throw new Error(
        `Gasto "${gastoObj.id}" tiene una categoría inválida: "${gastoObj.categoria}".`
      );
    }

    if (
      typeof gastoObj.monto_total !== 'number' ||
      !Number.isInteger(gastoObj.monto_total) ||
      gastoObj.monto_total <= 0
    ) {
      throw new Error(
        `Gasto "${gastoObj.id}" tiene un monto_total inválido (debe ser un entero mayor a 0).`
      );
    }

    if (!Array.isArray(gastoObj.aportes) || gastoObj.aportes.length === 0) {
      throw new Error(
        `Gasto "${gastoObj.id}" debe contener al menos un aporte en la lista de aportes.`
      );
    }

    let sumaAportes = 0;
    for (let j = 0; j < gastoObj.aportes.length; j++) {
      const a = gastoObj.aportes[j];
      if (typeof a !== 'object' || a === null) {
        throw new Error(`Aporte ${j} en gasto "${gastoObj.id}" no es válido.`);
      }

      const aporteObj = a as Record<string, unknown>;
      if (
        typeof aporteObj.persona_id !== 'string' ||
        !personaIds.has(aporteObj.persona_id)
      ) {
        throw new Error(
          `Aporte en gasto "${gastoObj.id}" referencia una persona inexistente (${aporteObj.persona_id}).`
        );
      }

      if (
        typeof aporteObj.monto !== 'number' ||
        !Number.isInteger(aporteObj.monto) ||
        aporteObj.monto <= 0
      ) {
        throw new Error(
          `Aporte en gasto "${gastoObj.id}" tiene un monto inválido (debe ser un entero mayor a 0).`
        );
      }

      sumaAportes += aporteObj.monto;
    }

    if (sumaAportes !== gastoObj.monto_total) {
      throw new Error(
        `Gasto "${gastoObj.id}": la suma de aportes (${sumaAportes}) no coincide con monto_total (${gastoObj.monto_total}).`
      );
    }

    if (
      !Array.isArray(gastoObj.participantes_ids) ||
      gastoObj.participantes_ids.length === 0
    ) {
      throw new Error(
        `Gasto "${gastoObj.id}" debe tener al menos un participante seleccionado.`
      );
    }

    for (const partId of gastoObj.participantes_ids) {
      if (typeof partId !== 'string' || !personaIds.has(partId)) {
        throw new Error(
          `Gasto "${gastoObj.id}" referencia un participante inexistente (${partId}).`
        );
      }
    }
  }

  // Actividades opcionales o con array por defecto
  const actividades: CategoriaGasto[] = Array.isArray(obj.actividades)
    ? (obj.actividades as CategoriaGasto[])
    : ['Asado', 'Bebidas'];

  // Validación opcional de módulo Fútbol
  let futbolData: Juntada['futbol'] = undefined;
  if (obj.futbol !== undefined) {
    if (typeof obj.futbol !== 'object' || obj.futbol === null) {
      throw new Error('Campo "futbol" inválido: debe ser un objeto.');
    }
    const futbolObj = obj.futbol as Record<string, unknown>;
    if (!Array.isArray(futbolObj.anotados)) {
      throw new Error('Campo "futbol.anotados" inválido: debe ser un array.');
    }
    const anotadosValidados = [];
    for (let i = 0; i < futbolObj.anotados.length; i++) {
      const a = futbolObj.anotados[i];
      if (typeof a !== 'object' || a === null) {
        throw new Error(`Anotado en índice ${i} no es un objeto válido.`);
      }
      const aObj = a as Record<string, unknown>;
      if (typeof aObj.id !== 'string' || !aObj.id.trim()) {
        throw new Error(`Anotado en índice ${i} tiene un "id" inválido.`);
      }
      if (typeof aObj.nombre !== 'string' || !aObj.nombre.trim()) {
        throw new Error(`Anotado en índice ${i} tiene un "nombre" inválido.`);
      }
      if (aObj.equipo !== undefined && aObj.equipo !== 'A' && aObj.equipo !== 'B') {
        throw new Error(`Anotado en índice ${i} tiene un equipo inválido (debe ser 'A' o 'B').`);
      }
      anotadosValidados.push({
        id: aObj.id,
        nombre: aObj.nombre.trim(),
        equipo: aObj.equipo as 'A' | 'B' | undefined,
      });
    }
    futbolData = { anotados: anotadosValidados };
  }

  // Validación opcional de módulo Truco
  let trucoData: Juntada['truco'] = undefined;
  if (obj.truco !== undefined) {
    if (typeof obj.truco !== 'object' || obj.truco === null) {
      throw new Error('Campo "truco" inválido: debe ser un objeto.');
    }
    const trucoObj = obj.truco as Record<string, unknown>;
    if (
      typeof trucoObj.puntos_nosotros !== 'number' ||
      !Number.isInteger(trucoObj.puntos_nosotros) ||
      trucoObj.puntos_nosotros < 0
    ) {
      throw new Error('Campo "truco.puntos_nosotros" inválido: debe ser un entero >= 0.');
    }
    if (
      typeof trucoObj.puntos_ellos !== 'number' ||
      !Number.isInteger(trucoObj.puntos_ellos) ||
      trucoObj.puntos_ellos < 0
    ) {
      throw new Error('Campo "truco.puntos_ellos" inválido: debe ser un entero >= 0.');
    }
    if (trucoObj.limite !== 15 && trucoObj.limite !== 30) {
      throw new Error('Campo "truco.limite" inválido: debe ser 15 o 30.');
    }
    trucoData = {
      puntos_nosotros: Math.min(trucoObj.puntos_nosotros, trucoObj.limite),
      puntos_ellos: Math.min(trucoObj.puntos_ellos, trucoObj.limite),
      limite: trucoObj.limite as 15 | 30,
    };
  }

  const nowIso = new Date().toISOString();

  return {
    id: obj.id,
    nombre: obj.nombre.trim(),
    alias_cobro: obj.alias_cobro.trim(),
    organizador_id: obj.organizador_id,
    actividades,
    personas: obj.personas as Juntada['personas'],
    gastos: obj.gastos as Juntada['gastos'],
    estado: obj.estado,
    created_at: typeof obj.created_at === 'string' ? obj.created_at : nowIso,
    updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : nowIso,
    futbol: futbolData,
    truco: trucoData,
  };
}

/**
 * Guarda la juntada en localStorage bajo la clave 'juntadita:juntada-activa'.
 */
export function guardarJuntada(j: Juntada): void {
  try {
    const raw = JSON.stringify(j);
    localStorage.setItem(STORAGE_KEY, raw);
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      throw new Error(
        'El almacenamiento del navegador está lleno. No se pudo guardar la juntada.'
      );
    }
    throw new Error('Error al guardar la juntada en el almacenamiento local.');
  }
}

/**
 * Carga y valida la juntada activa desde localStorage. Retorna null si no existe.
 */
export function cargarJuntada(): Juntada | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return validarEsquemaJuntada(parsed);
  } catch {
    return null;
  }
}

/**
 * Elimina la juntada activa de localStorage.
 */
export function borrarJuntada(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Exporta y descarga un archivo juntadita-[nombre]-[fecha].json con el contenido completo.
 */
export function exportarJuntadaAJSON(j: Juntada): void {
  const payload: JuntadaExportPayload = {
    version: 1,
    exported_at: new Date().toISOString(),
    juntada: j,
  };

  const nombreSanitizado = sanitizarNombreArchivo(j.nombre);
  const fecha = new Date().toISOString().split('T')[0];
  const filename = `juntadita-${nombreSanitizado}-${fecha}.json`;

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Importa y valida una juntada desde un archivo File cargado por el usuario.
 */
export async function importarJuntadaDesdeJSON(file: File): Promise<Juntada> {
  let texto: string;
  try {
    texto = await file.text();
  } catch {
    throw new Error('No se pudo leer el archivo seleccionado.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(texto);
  } catch {
    throw new Error('El archivo seleccionado no contiene un formato JSON válido.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('El archivo no contiene un objeto válido.');
  }

  const contenedor = parsed as Record<string, unknown>;
  const data = contenedor.juntada !== undefined ? contenedor.juntada : contenedor;

  return validarEsquemaJuntada(data);
}
