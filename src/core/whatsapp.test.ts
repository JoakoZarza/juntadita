import { describe, expect, it } from 'vitest';
import { formatearMonto, generarMensajeWhatsApp } from './whatsapp';
import { LiquidacionResultado } from './types';

describe('Formateador de Mensaje WhatsApp', () => {
  it('formatea montos con punto como separador de miles y sin decimales', () => {
    expect(formatearMonto(0)).toBe('0');
    expect(formatearMonto(500)).toBe('500');
    expect(formatearMonto(1500)).toBe('1.500');
    expect(formatearMonto(12500)).toBe('12.500');
    expect(formatearMonto(320000)).toBe('320.000');
    expect(formatearMonto(1500000)).toBe('1.500.000');
  });

  // Caso 10a: Mensaje con Bloque A y Bloque B presentes
  it('10a. Formato del mensaje de WhatsApp con Bloque A y Bloque B', () => {
    const liquidacion: LiquidacionResultado = {
      bloqueA_deudores: [
        { persona_id: 'p-1', apodo: 'Rama', monto_a_transferir: 15000 },
        { persona_id: 'p-2', apodo: 'Nico', monto_a_transferir: 12500 },
      ],
      bloqueB_acreedores: [
        { persona_id: 'p-3', apodo: 'Tincho', monto_a_devolver: 5000 },
      ],
      organizador: {
        persona_id: 'p-org',
        apodo: 'Joaco',
        saldo_neto_calculado: 22500,
        debe_poner_de_su_bolsillo: false,
        monto_a_poner_de_bolsillo: 0,
        residuo_redondeo_absorbido: 0,
      },
      totales: {
        total_general: 72500,
        por_categoria: {
          Asado: 45000,
          Bebidas: 20000,
          Fútbol: 7500,
          Otros: 0,
        },
      },
    };

    const mensaje = generarMensajeWhatsApp({
      nombreJuntada: 'Viernes de Asado',
      aliasCobro: 'joaco.asado.mp',
      apodoOrganizador: 'Joaco',
      liquidacion,
    });

    const expected = [
      '🍻 JUNTADA: Viernes de Asado',
      'Alias para transferir: joaco.asado.mp',
      '',
      '💸 Cada uno transfiere:',
      '- Nico: $12.500',
      '- Rama: $15.000',
      '',
      '📥 Joaco le devuelve a:',
      '- Tincho: $5.000',
      '',
      '📊 Totales:',
      '- Total gastado: $72.500',
      '- Asado: $45.000 | Bebidas: $20.000 | Fútbol: $7.500',
      '',
      'Cualquier duda, hablen con Joaco.',
    ].join('\n');

    expect(mensaje).toBe(expected);
    // Verificar que no contiene asteriscos de markdown
    expect(mensaje).not.toContain('*');
  });

  // Caso 10b: Mensaje sin Bloque B (nadie puso de más)
  it('10b. Formato del mensaje de WhatsApp omitiendo el Bloque B cuando nadie puso de más', () => {
    const liquidacion: LiquidacionResultado = {
      bloqueA_deudores: [
        { persona_id: 'p-1', apodo: 'Juan', monto_a_transferir: 10000 },
      ],
      bloqueB_acreedores: [],
      organizador: {
        persona_id: 'p-org',
        apodo: 'Joaco',
        saldo_neto_calculado: 10000,
        debe_poner_de_su_bolsillo: false,
        monto_a_poner_de_bolsillo: 0,
        residuo_redondeo_absorbido: 0,
      },
      totales: {
        total_general: 20000,
        por_categoria: {
          Asado: 20000,
          Bebidas: 0,
          Fútbol: 0,
          Otros: 0,
        },
      },
    };

    const mensaje = generarMensajeWhatsApp({
      nombreJuntada: 'Asado Chico',
      aliasCobro: 'joaco.mp',
      apodoOrganizador: 'Joaco',
      liquidacion,
    });

    // No debe contener "le devuelve a:"
    expect(mensaje).not.toContain('le devuelve a:');
    expect(mensaje).toContain('💸 Cada uno transfiere:');
    expect(mensaje).toContain('- Juan: $10.000');
    expect(mensaje).toContain('- Total gastado: $20.000');
    expect(mensaje).toContain('- Asado: $20.000');
    expect(mensaje).not.toContain('*');
  });

  // Caso 10c: Organizador con saldo en contra NO expone su deuda en el mensaje público
  it('10c. Organizador con saldo en contra no se expone en el mensaje público', () => {
    const liquidacion: LiquidacionResultado = {
      bloqueA_deudores: [],
      bloqueB_acreedores: [
        { persona_id: 'p-1', apodo: 'Tincho', monto_a_devolver: 10000 },
      ],
      organizador: {
        persona_id: 'p-org',
        apodo: 'Joaco',
        saldo_neto_calculado: -10000,
        debe_poner_de_su_bolsillo: true,
        monto_a_poner_de_bolsillo: 10000,
        residuo_redondeo_absorbido: 0,
      },
      totales: {
        total_general: 10000,
        por_categoria: {
          Asado: 10000,
          Bebidas: 0,
          Fútbol: 0,
          Otros: 0,
        },
      },
    };

    const mensaje = generarMensajeWhatsApp({
      nombreJuntada: 'Comida',
      aliasCobro: 'joaco.mp',
      apodoOrganizador: 'Joaco',
      liquidacion,
    });

    // El mensaje muestra que Joaco le devuelve a Tincho, pero no dice "Joaco debe poner de su bolsillo"
    expect(mensaje).toContain('📥 Joaco le devuelve a:\n- Tincho: $10.000');
    expect(mensaje).not.toContain('bolsillo');
    expect(mensaje).not.toContain('saldo en contra');
  });
});
