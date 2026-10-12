import { describe, expect, it } from 'vitest';
import { LiquidacionMinimizada } from './balance';
import { Persona } from './types';
import { generarMensajeWhatsAppMinimizado } from './whatsapp';

describe('generarMensajeWhatsAppMinimizado', () => {
  const pMarcos: Persona = {
    id: 'p1',
    apodo: 'Marcos',
    es_organizador: true,
    alias_cobro: 'marcos.mp',
  };
  const pJuan: Persona = { id: 'p2', apodo: 'Juan', es_organizador: false };
  const pMatias: Persona = { id: 'p3', apodo: 'Matías', es_organizador: false };
  const pPedro: Persona = { id: 'p4', apodo: 'Pedro', es_organizador: false };

  // 1. Mensaje con 3 transferencias, 1 acreedor.
  it('1. Genera mensaje con 3 transferencias y 1 acreedor', () => {
    const liquidacion: LiquidacionMinimizada = {
      transferencias: [
        {
          from_persona_id: 'p2',
          from_apodo: 'Juan',
          to_persona_id: 'p1',
          to_apodo: 'Marcos',
          monto: 1500,
        },
        {
          from_persona_id: 'p3',
          from_apodo: 'Matías',
          to_persona_id: 'p1',
          to_apodo: 'Marcos',
          monto: 2000,
        },
        {
          from_persona_id: 'p4',
          from_apodo: 'Pedro',
          to_persona_id: 'p1',
          to_apodo: 'Marcos',
          monto: 1000,
        },
      ],
      balances_individuales: [],
      totales: {
        total_general: 6000,
        por_categoria: {
          Asado: 4500,
          Bebidas: 1500,
          Fútbol: 0,
          Otros: 0,
        },
      },
    };

    const mensaje = generarMensajeWhatsAppMinimizado({
      nombreJuntada: 'Asado del Viernes',
      personas: [pMarcos, pJuan, pMatias, pPedro],
      liquidacion,
    });

    expect(mensaje).toContain('🍻 JUNTADA: Asado del Viernes');
    expect(mensaje).toContain('Total gastado: $6.000');
    expect(mensaje).toContain('💸 Transferencias:');
    // Se ordenan desc por monto: 2000, 1500, 1000
    expect(mensaje).toContain('- Matías → Marcos (alias: marcos.mp): $2.000');
    expect(mensaje).toContain('- Juan → Marcos (alias: marcos.mp): $1.500');
    expect(mensaje).toContain('- Pedro → Marcos (alias: marcos.mp): $1.000');
    expect(mensaje).toContain('📊 Totales por categoría:');
    expect(mensaje).toContain('- Asado: $4.500 | Bebidas: $1.500');
    expect(mensaje).toContain('Cualquier duda, hablen entre ustedes.');
  });

  // 2. Mensaje con 5 transferencias, 3 acreedores, algunos con alias, otros sin.
  it('2. Mensaje con 5 transferencias, 3 acreedores, algunos con alias, otros sin alias', () => {
    const pAcreedorConAlias: Persona = {
      id: 'a1',
      apodo: 'Santi',
      es_organizador: false,
      alias_cobro: 'santi.uala',
    };
    const pAcreedorSinAlias: Persona = {
      id: 'a2',
      apodo: 'Nico',
      es_organizador: false,
    };
    const pAcreedorOrg: Persona = {
      id: 'a3',
      apodo: 'Lucas',
      es_organizador: true,
      alias_cobro: 'lucas.mp',
    };
    const pDeudor1: Persona = { id: 'd1', apodo: 'Agus', es_organizador: false };
    const pDeudor2: Persona = { id: 'd2', apodo: 'Bauti', es_organizador: false };

    const liquidacion: LiquidacionMinimizada = {
      transferencias: [
        {
          from_persona_id: 'd1',
          from_apodo: 'Agus',
          to_persona_id: 'a1',
          to_apodo: 'Santi',
          monto: 5000,
        },
        {
          from_persona_id: 'd1',
          from_apodo: 'Agus',
          to_persona_id: 'a2',
          to_apodo: 'Nico',
          monto: 3000,
        },
        {
          from_persona_id: 'd2',
          from_apodo: 'Bauti',
          to_persona_id: 'a3',
          to_apodo: 'Lucas',
          monto: 4000,
        },
        {
          from_persona_id: 'd2',
          from_apodo: 'Bauti',
          to_persona_id: 'a2',
          to_apodo: 'Nico',
          monto: 2500,
        },
        {
          from_persona_id: 'd2',
          from_apodo: 'Bauti',
          to_persona_id: 'a1',
          to_apodo: 'Santi',
          monto: 1500,
        },
      ],
      balances_individuales: [],
      totales: {
        total_general: 20000,
        por_categoria: {
          Asado: 12000,
          Bebidas: 5000,
          Fútbol: 3000,
          Otros: 0,
        },
      },
    };

    const mensaje = generarMensajeWhatsAppMinimizado({
      nombreJuntada: 'Fútbol y Asado',
      personas: [pAcreedorConAlias, pAcreedorSinAlias, pAcreedorOrg, pDeudor1, pDeudor2],
      liquidacion,
    });

    // Con alias
    expect(mensaje).toContain('- Agus → Santi (alias: santi.uala): $5.000');
    expect(mensaje).toContain('- Bauti → Lucas (alias: lucas.mp): $4.000');
    expect(mensaje).toContain('- Bauti → Santi (alias: santi.uala): $1.500');

    // Sin alias (Nico no tiene alias cargado)
    expect(mensaje).toContain('- Agus → Nico: $3.000');
    expect(mensaje).toContain('- Bauti → Nico: $2.500');
    expect(mensaje).not.toContain('Nico (alias:');
  });

  // 3. Mensaje sin transferencias (todos saldados).
  it('3. Mensaje sin transferencias pendientes muestra texto apropiado', () => {
    const liquidacion: LiquidacionMinimizada = {
      transferencias: [],
      balances_individuales: [],
      totales: {
        total_general: 5000,
        por_categoria: {
          Asado: 0,
          Bebidas: 5000,
          Fútbol: 0,
          Otros: 0,
        },
      },
    };

    const mensaje = generarMensajeWhatsAppMinimizado({
      nombreJuntada: 'Juntada Express',
      personas: [pMarcos, pJuan],
      liquidacion,
    });

    expect(mensaje).toContain('No hay transferencias pendientes. ¡Todos al día!');
    expect(mensaje).toContain('Cualquier duda, hablen entre ustedes.');
  });

  // 4. Verificar que no hay asteriscos.
  it('4. Verifica que el mensaje final es texto plano estricto y no contiene ningún asterisco', () => {
    const liquidacion: LiquidacionMinimizada = {
      transferencias: [
        {
          from_persona_id: 'p2',
          from_apodo: 'Juan',
          to_persona_id: 'p1',
          to_apodo: 'Marcos',
          monto: 3500,
        },
      ],
      balances_individuales: [],
      totales: {
        total_general: 7000,
        por_categoria: {
          Asado: 7000,
          Bebidas: 0,
          Fútbol: 0,
          Otros: 0,
        },
      },
    };

    const mensaje = generarMensajeWhatsAppMinimizado({
      nombreJuntada: 'Juntada Sin Formato',
      personas: [pMarcos, pJuan],
      liquidacion,
    });

    expect(mensaje).not.toContain('*');
    expect(mensaje).not.toContain('**');
    expect(mensaje).not.toContain('_');
  });
});
