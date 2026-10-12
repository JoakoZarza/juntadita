import { beforeEach, describe, expect, it } from 'vitest';
import {
  borrarJuntada,
  cargarJuntada,
  guardarJuntada,
  sanitizarNombreArchivo,
  validarEsquemaJuntada,
} from './storage';
import { Juntada } from './types';

describe('Módulo de Persistencia Local (storage.ts)', () => {
  const juntadaValida: Juntada = {
    id: 'j-1',
    nombre: 'Asado del Viernes',
    alias_cobro: 'joaco.mp',
    organizador_id: 'p-1',
    actividades: ['Asado', 'Bebidas'],
    personas: [
      { id: 'p-1', apodo: 'Joaco', es_organizador: true },
      { id: 'p-2', apodo: 'Rama', es_organizador: false },
    ],
    gastos: [
      {
        id: 'g-1',
        categoria: 'Asado',
        monto_total: 20000,
        descripcion: 'Carne',
        aportes: [{ persona_id: 'p-1', monto: 20000 }],
        participantes_ids: ['p-1', 'p-2'],
      },
    ],
    estado: 'abierta',
    created_at: '2026-10-12T10:00:00.000Z',
    updated_at: '2026-10-12T10:00:00.000Z',
  };

  beforeEach(() => {
    localStorage.clear();
  });

  describe('validarEsquemaJuntada', () => {
    it('1. valida exitosamente una juntada completa y consistente', () => {
      const res = validarEsquemaJuntada(juntadaValida);
      expect(res.id).toBe('j-1');
      expect(res.personas).toHaveLength(2);
      expect(res.gastos).toHaveLength(1);
    });

    it('2. rechaza datos que no son un objeto', () => {
      expect(() => validarEsquemaJuntada(null)).toThrowError(/Estructura de datos inválida/);
      expect(() => validarEsquemaJuntada('string')).toThrowError(/Estructura de datos inválida/);
    });

    it('3. rechaza campos obligatorios vacíos o inválidos (id, nombre, alias, estado)', () => {
      expect(() => validarEsquemaJuntada({ ...juntadaValida, id: '' })).toThrowError(
        /Campo "id" inválido/
      );
      expect(() => validarEsquemaJuntada({ ...juntadaValida, nombre: '   ' })).toThrowError(
        /Campo "nombre" inválido/
      );
      expect(() => validarEsquemaJuntada({ ...juntadaValida, alias_cobro: '' })).toThrowError(
        /Campo "alias_cobro" inválido/
      );
      // @ts-expect-error estado inválido intencional
      expect(() => validarEsquemaJuntada({ ...juntadaValida, estado: 'otra_cosa' })).toThrowError(
        /Campo "estado" inválido/
      );
    });

    it('4. rechaza juntadas sin personas o con lista inválida', () => {
      expect(() => validarEsquemaJuntada({ ...juntadaValida, personas: [] })).toThrowError(
        /debe contener al menos una persona/
      );
    });

    it('5. rechaza juntada sin exactamente un organizador', () => {
      // 0 organizadores
      const sinOrg = {
        ...juntadaValida,
        personas: [
          { id: 'p-1', apodo: 'Joaco', es_organizador: false },
          { id: 'p-2', apodo: 'Rama', es_organizador: false },
        ],
      };
      expect(() => validarEsquemaJuntada(sinOrg)).toThrowError(
        /Debe existir exactamente un organizador/
      );

      // 2 organizadores
      const dosOrg = {
        ...juntadaValida,
        personas: [
          { id: 'p-1', apodo: 'Joaco', es_organizador: true },
          { id: 'p-2', apodo: 'Rama', es_organizador: true },
        ],
      };
      expect(() => validarEsquemaJuntada(dosOrg)).toThrowError(
        /Debe existir exactamente un organizador/
      );
    });

    it('6. rechaza cuando organizador_id no coincide con el de la persona organizadora', () => {
      const mismatch = {
        ...juntadaValida,
        organizador_id: 'p-2', // p-2 no es organizador
      };
      expect(() => validarEsquemaJuntada(mismatch)).toThrowError(
        /organizador_id no coincide/
      );
    });

    it('6b. valida alias_cobro opcional en personas y rechaza si es inválido', () => {
      // Con alias válido
      const conAlias = {
        ...juntadaValida,
        personas: [
          { id: 'p-1', apodo: 'Joaco', es_organizador: true, alias_cobro: 'joaco.mp' },
          { id: 'p-2', apodo: 'Rama', es_organizador: false, alias_cobro: 'rama.banco' },
        ],
      };
      expect(() => validarEsquemaJuntada(conAlias)).not.toThrow();

      // Con alias vacío
      const conAliasVacio = {
        ...juntadaValida,
        personas: [
          { id: 'p-1', apodo: 'Joaco', es_organizador: true, alias_cobro: '   ' },
          { id: 'p-2', apodo: 'Rama', es_organizador: false },
        ],
      };
      expect(() => validarEsquemaJuntada(conAliasVacio)).toThrowError(/alias_cobro.*inválido/);

      // Con alias mayor a 60 caracteres
      const conAliasLargo = {
        ...juntadaValida,
        personas: [
          { id: 'p-1', apodo: 'Joaco', es_organizador: true },
          { id: 'p-2', apodo: 'Rama', es_organizador: false, alias_cobro: 'a'.repeat(61) },
        ],
      };
      expect(() => validarEsquemaJuntada(conAliasLargo)).toThrowError(/alias_cobro.*inválido/);
    });

    it('7. rechaza categorías de gastos no reconocidas', () => {
      const gastoCatInvalida = {
        ...juntadaValida,
        gastos: [
          {
            ...juntadaValida.gastos[0],
            categoria: 'Casino',
          },
        ],
      };
      expect(() => validarEsquemaJuntada(gastoCatInvalida)).toThrowError(
        /categoría inválida: "Casino"/
      );
    });

    it('8. rechaza gasto donde la suma de aportes no iguala monto_total', () => {
      const sumaInvalida = {
        ...juntadaValida,
        gastos: [
          {
            ...juntadaValida.gastos[0],
            monto_total: 20000,
            aportes: [{ persona_id: 'p-1', monto: 15000 }], // faltan 5000
          },
        ],
      };
      expect(() => validarEsquemaJuntada(sumaInvalida)).toThrowError(
        /la suma de aportes \(15000\) no coincide con monto_total \(20000\)/
      );
    });

    it('9. rechaza aporte o participante que referencia una persona inexistente', () => {
      const aportePersonaFantasma = {
        ...juntadaValida,
        gastos: [
          {
            ...juntadaValida.gastos[0],
            aportes: [{ persona_id: 'p-fantasma', monto: 20000 }],
          },
        ],
      };
      expect(() => validarEsquemaJuntada(aportePersonaFantasma)).toThrowError(
        /referencia una persona inexistente \(p-fantasma\)/
      );

      const partPersonaFantasma = {
        ...juntadaValida,
        gastos: [
          {
            ...juntadaValida.gastos[0],
            participantes_ids: ['p-1', 'p-inexistente'],
          },
        ],
      };
      expect(() => validarEsquemaJuntada(partPersonaFantasma)).toThrowError(
        /referencia un participante inexistente \(p-inexistente\)/
      );
    });
  });

  describe('sanitizarNombreArchivo', () => {
    it('10. sanitiza nombres convirtiendo a minúsculas, reemplazando símbolos y quitando acentos', () => {
      expect(sanitizarNombreArchivo('Asado del Viernes!!!')).toBe('asado-del-viernes');
      expect(sanitizarNombreArchivo('Fútbol y Peña')).toBe('futbol-y-pena');
    });

    it('11. trunca nombres largos a 30 caracteres sin guión residual al final', () => {
      const nombreLargo = 'Una Juntada Gigante Con Muchisimos Amigos';
      const sanitizado = sanitizarNombreArchivo(nombreLargo);
      expect(sanitizado.length).toBeLessThanOrEqual(30);
      expect(sanitizado).not.toMatch(/-$/);
    });

    it('12. devuelve "juntada" de respaldo ante nombres vacíos o solo de símbolos', () => {
      expect(sanitizarNombreArchivo('   ')).toBe('juntada');
      expect(sanitizarNombreArchivo('???!!!***')).toBe('juntada');
    });
  });

  describe('localStorage (guardar, cargar, borrar)', () => {
    it('13. guarda y carga la juntada correctamente desde localStorage', () => {
      guardarJuntada(juntadaValida);
      const cargada = cargarJuntada();
      expect(cargada).not.toBeNull();
      expect(cargada?.id).toBe(juntadaValida.id);
      expect(cargada?.nombre).toBe(juntadaValida.nombre);
    });

    it('14. borra la juntada de localStorage', () => {
      guardarJuntada(juntadaValida);
      expect(cargarJuntada()).not.toBeNull();
      borrarJuntada();
      expect(cargarJuntada()).toBeNull();
    });

    it('15. devuelve null si los datos en localStorage están corruptos', () => {
      localStorage.setItem('juntadita:juntada-activa', '{ "json_invalido": true');
      expect(cargarJuntada()).toBeNull();
    });
  });
});
