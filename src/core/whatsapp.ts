import { CategoriaGasto, LiquidacionResultado, Persona } from './types';
import { LiquidacionMinimizada } from './balance';

/**
 * Formatea un número entero con punto como separador de miles sin decimales.
 * Ejemplo: 15000 -> "15.000"
 */
export function formatearMonto(monto: number): string {
  const entero = Math.round(monto);
  const partes = Math.abs(entero).toString().split('');
  let resultado = '';
  let contador = 0;

  for (let i = partes.length - 1; i >= 0; i--) {
    resultado = partes[i] + resultado;
    contador++;
    if (contador === 3 && i !== 0) {
      resultado = '.' + resultado;
      contador = 0;
    }
  }

  return entero < 0 ? `-${resultado}` : resultado;
}

export interface GenerarMensajeWhatsAppParams {
  nombreJuntada: string;
  aliasCobro: string;
  apodoOrganizador: string;
  liquidacion: LiquidacionResultado;
}

/**
 * Genera el mensaje final de texto plano listo para copiar y pegar en WhatsApp.
 *
 * Cumple estrictamente con las reglas:
 * 1. Texto plano, sin asteriscos ni markdown.
 * 2. Montos con separador de miles con punto y sin decimales.
 * 3. Si no hay personas en Bloque B, se omite esa sección entera.
 * 4. Si el organizador debe poner de su bolsillo, no se muestra en el mensaje (solo en la app).
 * 5. Emojis permitidos solo en este mensaje.
 */
export function generarMensajeWhatsApp({
  nombreJuntada,
  aliasCobro,
  apodoOrganizador,
  liquidacion,
}: GenerarMensajeWhatsAppParams): string {
  const lineas: string[] = [];

  // Cabecera
  lineas.push(`🍻 JUNTADA: ${nombreJuntada}`);
  lineas.push(`Alias para transferir: ${aliasCobro}`);
  lineas.push('');

  // Bloque A: Deudores
  if (liquidacion.bloqueA_deudores.length > 0) {
    lineas.push('💸 Cada uno transfiere:');
    const deudores = [...liquidacion.bloqueA_deudores].sort((a, b) =>
      a.apodo.localeCompare(b.apodo)
    );
    for (const deudor of deudores) {
      lineas.push(`- ${deudor.apodo}: $${formatearMonto(deudor.monto_a_transferir)}`);
    }
    lineas.push('');
  }

  // Bloque B: Reintegros (omitir si nadie puso de más)
  if (liquidacion.bloqueB_acreedores.length > 0) {
    lineas.push(`📥 ${apodoOrganizador} le devuelve a:`);
    const acreedores = [...liquidacion.bloqueB_acreedores].sort((a, b) =>
      a.apodo.localeCompare(b.apodo)
    );
    for (const acreedor of acreedores) {
      lineas.push(`- ${acreedor.apodo}: $${formatearMonto(acreedor.monto_a_devolver)}`);
    }
    lineas.push('');
  }

  // Bloque C: Totales
  lineas.push('📊 Totales:');
  lineas.push(`- Total gastado: $${formatearMonto(liquidacion.totales.total_general)}`);

  // Desglose por categorías con gasto > 0
  const categoriasConGasto: string[] = [];
  const ordenCategorias: CategoriaGasto[] = ['Asado', 'Bebidas', 'Fútbol', 'Otros'];

  for (const cat of ordenCategorias) {
    const montoCat = liquidacion.totales.por_categoria[cat] || 0;
    if (montoCat > 0) {
      categoriasConGasto.push(`${cat}: $${formatearMonto(montoCat)}`);
    }
  }

  if (categoriasConGasto.length > 0) {
    lineas.push(`- ${categoriasConGasto.join(' | ')}`);
  }
  lineas.push('');

  // Cierre
  lineas.push(`Cualquier duda, hablen con ${apodoOrganizador}.`);

  return lineas.join('\n');
}

export interface GenerarMensajeWhatsAppMinimizadoParams {
  nombreJuntada: string;
  personas: Persona[];
  liquidacion: LiquidacionMinimizada;
}

/**
 * Genera el mensaje final de texto plano con minimización de transferencias P2P.
 *
 * Formato:
 * 🍻 JUNTADA: [Nombre]
 * Total gastado: $[total]
 *
 * 💸 Transferencias:
 * - [Deudor] → [Acreedor]: $[monto]
 * - [Deudor] → [Acreedor] (alias: [alias]): $[monto]
 *
 * 📊 Totales por categoría:
 * - Asado: $[monto] | Bebidas: $[monto]
 *
 * Cualquier duda, hablen entre ustedes.
 */
export function generarMensajeWhatsAppMinimizado({
  nombreJuntada,
  personas,
  liquidacion,
}: GenerarMensajeWhatsAppMinimizadoParams): string {
  const lineas: string[] = [];

  lineas.push(`🍻 JUNTADA: ${nombreJuntada}`);
  lineas.push(`Total gastado: $${formatearMonto(liquidacion.totales.total_general)}`);
  lineas.push('');

  lineas.push('💸 Transferencias:');
  if (liquidacion.transferencias.length === 0) {
    lineas.push('No hay transferencias pendientes. ¡Todos al día!');
  } else {
    // Ordenar transferencias por monto descendente
    const transferenciasOrdenadas = [...liquidacion.transferencias].sort((a, b) => {
      if (b.monto !== a.monto) {
        return b.monto - a.monto;
      }
      const cmpFrom = a.from_apodo.localeCompare(b.from_apodo);
      if (cmpFrom !== 0) return cmpFrom;
      return a.to_apodo.localeCompare(b.to_apodo);
    });

    const mapaPersonas = new Map<string, Persona>(personas.map((p) => [p.id, p]));

    for (const t of transferenciasOrdenadas) {
      const acreedor = mapaPersonas.get(t.to_persona_id);
      const alias = acreedor?.alias_cobro ? ` (alias: ${acreedor.alias_cobro})` : '';
      lineas.push(`- ${t.from_apodo} → ${t.to_apodo}${alias}: $${formatearMonto(t.monto)}`);
    }
  }
  lineas.push('');

  lineas.push('📊 Totales por categoría:');
  const categoriasConGasto: string[] = [];
  const ordenCategorias: CategoriaGasto[] = ['Asado', 'Bebidas', 'Fútbol', 'Otros'];

  for (const cat of ordenCategorias) {
    const montoCat = liquidacion.totales.por_categoria[cat] || 0;
    if (montoCat > 0) {
      categoriasConGasto.push(`${cat}: $${formatearMonto(montoCat)}`);
    }
  }

  if (categoriasConGasto.length > 0) {
    lineas.push(`- ${categoriasConGasto.join(' | ')}`);
  } else {
    lineas.push('- Sin gastos');
  }
  lineas.push('');

  lineas.push('Cualquier duda, hablen entre ustedes.');

  return lineas.join('\n');
}
