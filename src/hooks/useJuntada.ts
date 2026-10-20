import { useEffect, useState } from 'react';
import { puedeBorrarGasto, puedeBorrarPersona } from '../core/rules';
import { generarId } from '../core/security';
import {
  borrarJuntada,
  cargarJuntada,
  exportarJuntadaAJSON,
  guardarJuntada,
  importarJuntadaDesdeJSON,
} from '../core/storage';
import {
  CategoriaGasto,
  FutbolAnotado,
  Gasto,
  GastoAporte,
  Juntada,
  Persona,
  TrucoPartida,
} from '../core/types';

export interface DatosCrearJuntada {
  nombre: string;
  apodo: string;
  alias_cobro: string;
  actividades: CategoriaGasto[];
}

export interface DatosCrearGasto {
  categoria: CategoriaGasto;
  monto_total: number;
  descripcion?: string;
  aportes: GastoAporte[];
  participantes_ids: string[];
}

export interface UseJuntadaReturn {
  juntada: Juntada | null;
  cargando: boolean;
  errorGuardado: string | null;
  crearJuntada: (datos: DatosCrearJuntada) => void;
  agregarPersona: (apodo: string, alias_cobro?: string) => { ok: true; id: string } | { ok: false; error: string };
  eliminarPersona: (personaId: string) => { ok: true } | { ok: false; error: string };
  actualizarAliasPersona: (personaId: string, alias: string) => void;
  agregarGasto: (datos: DatosCrearGasto) => { ok: true; id: string } | { ok: false; error: string };
  eliminarGasto: (gastoId: string) => { ok: true } | { ok: false; error: string };
  restaurarGasto: (gasto: Gasto, indice: number) => void;
  cerrarJuntada: () => { ok: true } | { ok: false; error: string };
  reabrirJuntada: () => { ok: true } | { ok: false; error: string };
  exportarJuntada: () => void;
  importarJuntada: (file: File) => Promise<{ ok: true } | { ok: false; error: string }>;
  agregarAnotado: (nombre: string) => { ok: true } | { ok: false; error: string };
  eliminarAnotado: (anotadoId: string) => void;
  sortearEquipos: () => void;
  actualizarTruco: (parcial: Partial<TrucoPartida>) => void;
  nuevaJuntada: () => void;
}

export function useJuntada(): UseJuntadaReturn {
  const [juntada, setJuntada] = useState<Juntada | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  // Carga inicial desde localStorage
  useEffect(() => {
    try {
      const guardada = cargarJuntada();
      if (guardada) {
        setJuntada(guardada);
      }
    } catch {
      setJuntada(null);
    } finally {
      setCargando(false);
    }
  }, []);

  // Persistencia automática ante cualquier cambio en el estado
  useEffect(() => {
    if (cargando) return;

    if (juntada) {
      try {
        guardarJuntada(juntada);
        setErrorGuardado(null);
      } catch (err) {
        console.error('Error al persistir juntada en localStorage:', err);
        setErrorGuardado(
          err instanceof Error ? err.message : 'No se pudo guardar la juntada en este dispositivo.'
        );
      }
    }
  }, [juntada, cargando]);

  const crearJuntada = (datos: DatosCrearJuntada) => {
    const orgId = generarId();
    const juntadaId = generarId();
    const nowIso = new Date().toISOString();

    const organizador: Persona = {
      id: orgId,
      apodo: datos.apodo.trim(),
      es_organizador: true,
      alias_cobro: datos.alias_cobro.trim(),
    };

    const nueva: Juntada = {
      id: juntadaId,
      nombre: datos.nombre.trim(),
      alias_cobro: datos.alias_cobro.trim(),
      organizador_id: orgId,
      actividades: datos.actividades,
      personas: [organizador],
      gastos: [],
      estado: 'abierta',
      created_at: nowIso,
      updated_at: nowIso,
    };

    setJuntada(nueva);
  };

  const agregarPersona = (
    apodo: string,
    alias_cobro?: string
  ): { ok: true; id: string } | { ok: false; error: string } => {
    if (!juntada) {
      return { ok: false, error: 'No hay ninguna juntada activa.' };
    }

    if (juntada.estado === 'cerrada') {
      return { ok: false, error: 'La juntada está cerrada. Reabrila para sumar personas.' };
    }

    const apodoLimpio = apodo.trim();
    if (!apodoLimpio) {
      return { ok: false, error: 'Ingresá un apodo para sumar a la persona.' };
    }

    if (apodoLimpio.length > 30) {
      return { ok: false, error: 'El apodo no puede superar los 30 caracteres.' };
    }

    // Regla de unicidad case-insensitive
    const apodoEnUso = juntada.personas.some(
      (p) => p.apodo.trim().toLowerCase() === apodoLimpio.toLowerCase()
    );

    if (apodoEnUso) {
      return { ok: false, error: 'Ese apodo ya está en la lista de la juntada.' };
    }

    const aliasLimpio = alias_cobro?.trim();
    if (aliasLimpio && aliasLimpio.length > 60) {
      return { ok: false, error: 'El alias no puede superar los 60 caracteres.' };
    }

    const nuevaPersona: Persona = {
      id: generarId(),
      apodo: apodoLimpio,
      es_organizador: false,
      alias_cobro: aliasLimpio || undefined,
    };

    setJuntada({
      ...juntada,
      personas: [...juntada.personas, nuevaPersona],
      updated_at: new Date().toISOString(),
    });

    return { ok: true, id: nuevaPersona.id };
  };

  const actualizarAliasPersona = (personaId: string, alias: string) => {
    if (!juntada) return;
    const aliasLimpio = alias.trim();
    setJuntada({
      ...juntada,
      personas: juntada.personas.map((p) =>
        p.id === personaId ? { ...p, alias_cobro: aliasLimpio || undefined } : p
      ),
      updated_at: new Date().toISOString(),
    });
  };

  const eliminarPersona = (personaId: string): { ok: true } | { ok: false; error: string } => {
    if (!juntada) {
      return { ok: false, error: 'No hay ninguna juntada activa.' };
    }

    if (juntada.estado === 'cerrada') {
      return { ok: false, error: 'La juntada está cerrada. Reabrila para quitar personas.' };
    }

    const validacion = puedeBorrarPersona(juntada, personaId);
    if (!validacion.ok) {
      return { ok: false, error: validacion.motivo || 'No se puede eliminar la persona.' };
    }

    setJuntada({
      ...juntada,
      personas: juntada.personas.filter((p) => p.id !== personaId),
      updated_at: new Date().toISOString(),
    });

    return { ok: true };
  };

  const agregarGasto = (
    datos: DatosCrearGasto
  ): { ok: true; id: string } | { ok: false; error: string } => {
    if (!juntada) {
      return { ok: false, error: 'No hay ninguna juntada activa.' };
    }

    if (juntada.estado === 'cerrada') {
      return { ok: false, error: 'La juntada está cerrada. Cuentas congeladas.' };
    }

    if (!datos.aportes || datos.aportes.length === 0) {
      return { ok: false, error: 'Cargá al menos un aporte.' };
    }

    for (const aporte of datos.aportes) {
      if (
        typeof aporte.monto !== 'number' ||
        !Number.isInteger(aporte.monto) ||
        aporte.monto <= 0
      ) {
        return {
          ok: false,
          error: 'Todos los aportes deben ser números enteros mayores a 0.',
        };
      }
      if (!juntada.personas.some((p) => p.id === aporte.persona_id)) {
        return {
          ok: false,
          error: 'Uno de los aportantes no pertenece a la juntada.',
        };
      }
    }

    const aportantesUnicos = new Set(datos.aportes.map((a) => a.persona_id));
    if (aportantesUnicos.size !== datos.aportes.length) {
      return {
        ok: false,
        error: 'Una persona aparece dos veces en los aportes. Sumá sus montos en una sola fila.',
      };
    }

    const sumaAportes = datos.aportes.reduce((acc, a) => acc + a.monto, 0);
    if (sumaAportes !== datos.monto_total) {
      return {
        ok: false,
        error: `La suma de aportes ($${sumaAportes}) no coincide con el total ($${datos.monto_total}).`,
      };
    }

    if (!datos.participantes_ids || datos.participantes_ids.length === 0) {
      return {
        ok: false,
        error: 'Seleccioná al menos un participante para este gasto.',
      };
    }

    for (const partId of datos.participantes_ids) {
      if (!juntada.personas.some((p) => p.id === partId)) {
        return {
          ok: false,
          error: 'Uno de los participantes no pertenece a la juntada.',
        };
      }
    }

    const nowIso = new Date().toISOString();
    const nuevoGasto: Gasto = {
      id: generarId(),
      categoria: datos.categoria,
      monto_total: datos.monto_total,
      descripcion: datos.descripcion ? datos.descripcion.trim() : '',
      aportes: datos.aportes,
      participantes_ids: datos.participantes_ids,
      created_at: nowIso,
    };

    setJuntada({
      ...juntada,
      gastos: [nuevoGasto, ...juntada.gastos], // Orden descendente: el más reciente arriba
      updated_at: nowIso,
    });

    return { ok: true, id: nuevoGasto.id };
  };

  const eliminarGasto = (
    gastoId: string
  ): { ok: true } | { ok: false; error: string } => {
    if (!juntada) {
      return { ok: false, error: 'No hay ninguna juntada activa.' };
    }

    const validacion = puedeBorrarGasto(juntada);
    if (!validacion.ok) {
      return { ok: false, error: validacion.motivo || 'No se puede eliminar el gasto.' };
    }

    setJuntada({
      ...juntada,
      gastos: juntada.gastos.filter((g) => g.id !== gastoId),
      updated_at: new Date().toISOString(),
    });

    return { ok: true };
  };

  // Deshacer un borrado: vuelve a poner el gasto en la misma posición de la lista
  // Usa el estado actual (no el del render en que se borró): se llama segundos después
  const restaurarGasto = (gasto: Gasto, indice: number) => {
    setJuntada((actual) => {
      if (!actual || actual.estado === 'cerrada') return actual;
      if (actual.gastos.some((g) => g.id === gasto.id)) return actual;

      const gastos = [...actual.gastos];
      gastos.splice(Math.min(Math.max(indice, 0), gastos.length), 0, gasto);
      return {
        ...actual,
        gastos,
        updated_at: new Date().toISOString(),
      };
    });
  };

  const cerrarJuntada = (): { ok: true } | { ok: false; error: string } => {
    if (!juntada) {
      return { ok: false, error: 'No hay ninguna juntada activa.' };
    }

    if (juntada.estado !== 'abierta') {
      return { ok: false, error: 'La juntada ya se encuentra cerrada.' };
    }

    const nowIso = new Date().toISOString();
    setJuntada({
      ...juntada,
      estado: 'cerrada',
      updated_at: nowIso,
    });

    return { ok: true };
  };

  const reabrirJuntada = (): { ok: true } | { ok: false; error: string } => {
    if (!juntada) {
      return { ok: false, error: 'No hay ninguna juntada activa.' };
    }

    if (juntada.estado !== 'cerrada') {
      return { ok: false, error: 'La juntada ya se encuentra abierta.' };
    }

    const nowIso = new Date().toISOString();
    setJuntada({
      ...juntada,
      estado: 'abierta',
      updated_at: nowIso,
    });

    return { ok: true };
  };

  const exportarJuntada = () => {
    if (!juntada) return;
    exportarJuntadaAJSON(juntada);
  };

  const importarJuntada = async (
    file: File
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const importada = await importarJuntadaDesdeJSON(file);
      setJuntada(importada);
      return { ok: true };
    } catch (err) {
      // Los detalles de validación del esquema no le sirven al usuario
      console.error('Error al importar backup:', err);
      const noSePudoLeer = err instanceof Error && err.message.startsWith('No se pudo leer');
      return {
        ok: false,
        error: noSePudoLeer
          ? 'No se pudo leer el archivo. Probá elegirlo de nuevo.'
          : 'Ese archivo no es un backup de Juntadita o está dañado.',
      };
    }
  };

  const agregarAnotado = (
    nombre: string
  ): { ok: true } | { ok: false; error: string } => {
    if (!juntada) {
      return { ok: false, error: 'No hay ninguna juntada activa.' };
    }

    const limpio = nombre.trim();
    if (!limpio) {
      return { ok: false, error: 'Ingresá un nombre para anotar.' };
    }

    if (limpio.length > 30) {
      return { ok: false, error: 'El nombre no puede superar los 30 caracteres.' };
    }

    const anotadosActuales = juntada.futbol?.anotados || [];
    const nuevoAnotado: FutbolAnotado = {
      id: generarId(),
      nombre: limpio,
    };

    const nowIso = new Date().toISOString();
    setJuntada({
      ...juntada,
      futbol: {
        anotados: [...anotadosActuales, nuevoAnotado],
      },
      updated_at: nowIso,
    });

    return { ok: true };
  };

  const eliminarAnotado = (anotadoId: string) => {
    if (!juntada || !juntada.futbol) return;

    const filtrados = juntada.futbol.anotados.filter((a) => a.id !== anotadoId);
    const nowIso = new Date().toISOString();

    setJuntada({
      ...juntada,
      futbol: {
        anotados: filtrados,
      },
      updated_at: nowIso,
    });
  };

  const sortearEquipos = () => {
    if (!juntada || !juntada.futbol || juntada.futbol.anotados.length < 2) return;

    const lista = [...juntada.futbol.anotados];
    // Fisher-Yates random shuffle
    for (let i = lista.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }

    // Si es impar, el equipo A se lleva el extra
    const mitadA = Math.ceil(lista.length / 2);
    const conEquipos: FutbolAnotado[] = lista.map((a, idx) => ({
      ...a,
      equipo: idx < mitadA ? 'A' : 'B',
    }));

    const nowIso = new Date().toISOString();
    setJuntada({
      ...juntada,
      futbol: {
        anotados: conEquipos,
      },
      updated_at: nowIso,
    });
  };

  const actualizarTruco = (parcial: Partial<TrucoPartida>) => {
    if (!juntada) return;

    const trucoActual: TrucoPartida = juntada.truco || {
      puntos_nosotros: 0,
      puntos_ellos: 0,
      limite: 30,
    };

    const nuevoLimite = parcial.limite !== undefined ? parcial.limite : trucoActual.limite;
    const nuevosNosotros = Math.max(
      0,
      Math.min(
        nuevoLimite,
        parcial.puntos_nosotros !== undefined
          ? parcial.puntos_nosotros
          : trucoActual.puntos_nosotros
      )
    );
    const nuevosEllos = Math.max(
      0,
      Math.min(
        nuevoLimite,
        parcial.puntos_ellos !== undefined ? parcial.puntos_ellos : trucoActual.puntos_ellos
      )
    );

    const nowIso = new Date().toISOString();
    setJuntada({
      ...juntada,
      truco: {
        puntos_nosotros: nuevosNosotros,
        puntos_ellos: nuevosEllos,
        limite: nuevoLimite,
      },
      updated_at: nowIso,
    });
  };

  const nuevaJuntada = () => {
    borrarJuntada();
    setJuntada(null);
  };

  return {
    juntada,
    cargando,
    errorGuardado,
    crearJuntada,
    agregarPersona,
    eliminarPersona,
    actualizarAliasPersona,
    agregarGasto,
    eliminarGasto,
    restaurarGasto,
    cerrarJuntada,
    reabrirJuntada,
    exportarJuntada,
    importarJuntada,
    agregarAnotado,
    eliminarAnotado,
    sortearEquipos,
    actualizarTruco,
    nuevaJuntada,
  };
}
