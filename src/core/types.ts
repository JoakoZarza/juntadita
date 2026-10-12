export type CategoriaGasto = 'Fútbol' | 'Asado' | 'Bebidas' | 'Otros';

export interface Persona {
  id: string;
  apodo: string;
  es_organizador: boolean;
  alias_cobro?: string;
}

export interface GastoAporte {
  persona_id: string;
  monto: number; // Entero en ARS (> 0)
}

export interface Gasto {
  id: string;
  categoria: CategoriaGasto;
  monto_total: number; // Entero en ARS (> 0), debe coincidir con suma de aportes
  descripcion?: string;
  aportes: GastoAporte[];
  participantes_ids: string[]; // IDs de personas que consumen este gasto
  created_at?: string; // ISO 8601 para hora de carga
}

export interface Deudor {
  persona_id: string;
  apodo: string;
  monto_a_transferir: number;
}

export interface Acreedor {
  persona_id: string;
  apodo: string;
  monto_a_devolver: number;
}

export interface OrganizadorBalance {
  persona_id: string;
  apodo: string;
  saldo_neto_calculado: number;
  debe_poner_de_su_bolsillo: boolean;
  monto_a_poner_de_bolsillo: number;
  residuo_redondeo_absorbido: number;
}

export interface LiquidacionResultado {
  bloqueA_deudores: Deudor[];
  bloqueB_acreedores: Acreedor[];
  organizador: OrganizadorBalance;
  totales: {
    total_general: number;
    por_categoria: Record<CategoriaGasto, number>;
  };
}

export interface FutbolAnotado {
  id: string;
  nombre: string;
  equipo?: 'A' | 'B';
}

export interface TrucoPartida {
  puntos_nosotros: number;
  puntos_ellos: number;
  limite: 15 | 30;
}

export interface Juntada {
  id: string;
  nombre: string;
  alias_cobro: string;
  organizador_id: string; // persona_id del organizador
  actividades: CategoriaGasto[];
  personas: Persona[];
  gastos: Gasto[];
  estado: 'abierta' | 'cerrada';
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  futbol?: { anotados: FutbolAnotado[] };
  truco?: TrucoPartida;
}
