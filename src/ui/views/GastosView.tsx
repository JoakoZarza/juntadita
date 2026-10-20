import React, { useState } from 'react';
import { Lock, Trash2, Users, Wallet } from 'lucide-react';
import { formatearMonto } from '../../core/whatsapp';
import { CategoriaGasto, Gasto, Juntada } from '../../core/types';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';

export interface GastosViewProps {
  juntada: Juntada;
  onEliminarGasto: (gastoId: string) => { ok: true } | { ok: false; error: string };
  onCargarGasto?: () => void;
  gastoResaltadoId?: string | null;
}

type FiltroCategoria = 'Todos' | CategoriaGasto;

export const GastosView: React.FC<GastosViewProps> = ({
  juntada,
  onEliminarGasto,
  onCargarGasto,
  gastoResaltadoId,
}) => {
  const [filtro, setFiltro] = useState<FiltroCategoria>('Todos');

  // Solo las categorías de la juntada (o que ya tienen gastos cargados)
  const categoriasFiltro: FiltroCategoria[] = [
    'Todos',
    ...(['Asado', 'Fútbol', 'Bebidas', 'Otros'] as CategoriaGasto[]).filter(
      (cat) => juntada.actividades.includes(cat) || juntada.gastos.some((g) => g.categoria === cat)
    ),
  ];

  // Gastos filtrados
  const gastosFiltrados = juntada.gastos.filter((g) =>
    filtro === 'Todos' ? true : g.categoria === filtro
  );

  // Mapa rápido de id a apodo para listar los aportantes
  const mapaPersonas = new Map(juntada.personas.map((p) => [p.id, p.apodo]));

  const formatTextoAportantes = (gasto: Gasto): string => {
    if (gasto.aportes.length === 1) {
      const a = gasto.aportes[0];
      const apodo = mapaPersonas.get(a.persona_id) || 'Alguien';
      return `Aportó ${apodo} ($${formatearMonto(a.monto)})`;
    }

    const partes = gasto.aportes.map((a) => {
      const apodo = mapaPersonas.get(a.persona_id) || 'Alguien';
      return `${apodo} ($${formatearMonto(a.monto)})`;
    });

    if (partes.length === 2) {
      return `Aportaron ${partes[0]} y ${partes[1]}`;
    }

    return `Aportaron ${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
  };

  const formatHora = (isoDate?: string): string => {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      return d.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return '';
    }
  };

  const totalGastadoFiltrado = gastosFiltrados.reduce((sum, g) => sum + g.monto_total, 0);

  return (
    <div className="stack gap-16">
      {/* Estado de juntada cerrada: cartel con ícono Lock */}
      {juntada.estado === 'cerrada' && (
        <div className="card aviso-cerrada">
          <Lock size={18} />
          <span>Juntada cerrada. Cuentas congeladas.</span>
        </div>
      )}

      {/* Cabecera del tab */}
      <div className="tab-header tab-header-baseline">
        <div className="screen-title">
          <Wallet size={22} color="var(--accent-coral)" />
          <span>Gastos ({juntada.gastos.length})</span>
        </div>

        {totalGastadoFiltrado > 0 && (
          <span className="monto text-lg c-coral">${formatearMonto(totalGastadoFiltrado)}</span>
        )}
      </div>

      {/* Filtro horizontal de categorías */}
      <div className="chips-scroll">
        {categoriasFiltro.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            categoria={cat === 'Todos' ? undefined : cat}
            active={filtro === cat}
            onClick={() => setFiltro(cat)}
          />
        ))}
      </div>

      {/* Lista de gastos / Estado vacío */}
      {gastosFiltrados.length === 0 ? (
        <div className="card card-vacia card-vacia-lg">
          <Wallet size={40} color="var(--text-muted)" strokeWidth={1.5} />
          {filtro !== 'Todos' ? (
            <>
              <p className="text-base">No hay gastos de {filtro} todavía.</p>
              <Button variant="secondary" size="sm" onClick={() => setFiltro('Todos')}>
                Ver todos los gastos
              </Button>
            </>
          ) : juntada.estado === 'cerrada' ? (
            <p className="text-base">No se cargaron gastos en esta juntada.</p>
          ) : (
            <>
              <p className="text-base">
                Todavía no hay gastos cargados. Tocá el botón + para sumar el primero.
              </p>
              {onCargarGasto && (
                <Button variant="primary" onClick={onCargarGasto} className="mt-8">
                  Cargar primer gasto
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="stack gap-12">
          {gastosFiltrados.map((gasto) => {
            const hora = formatHora(gasto.created_at);
            const tituloGasto = gasto.descripcion?.trim() ? gasto.descripcion.trim() : gasto.categoria;

            return (
              <div
                key={gasto.id}
                className={`gasto-card ${gasto.id === gastoResaltadoId ? 'gasto-card-nuevo' : ''}`}
              >
                {/* Fila superior: Chip + hora a la izquierda, Botón Trash2 arriba a la derecha */}
                <div className="row-between">
                  <div className="row gap-8">
                    <Chip
                      label={gasto.categoria}
                      categoria={gasto.categoria}
                      size="sm"
                      active
                    />
                    {hora && <span className="gasto-hora">{hora}</span>}
                  </div>

                  {juntada.estado === 'abierta' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={<Trash2 size={16} />}
                      onClick={() => onEliminarGasto(gasto.id)}
                      title="Borrar gasto"
                      aria-label={`Borrar gasto ${tituloGasto}`}
                    />
                  )}
                </div>

                {/* Fila central: descripción a la izquierda, monto destacado a la derecha */}
                <div className="gasto-fila-principal">
                  <span className="gasto-titulo">{tituloGasto}</span>

                  <span className="monto text-xl c-primary nowrap">
                    ${formatearMonto(gasto.monto_total)}
                  </span>
                </div>

                {/* Fila inferior: Aportantes a la izquierda, Badge con Users a la derecha */}
                <div className="gasto-pie">
                  <span className="gasto-aportantes" title={formatTextoAportantes(gasto)}>
                    {formatTextoAportantes(gasto)}
                  </span>

                  <div
                    className="gasto-participantes"
                    title={`Participan ${gasto.participantes_ids.length} de ${juntada.personas.length} personas`}
                  >
                    <Users size={13} aria-hidden="true" />
                    <span className="tabular-nums">
                      {gasto.participantes_ids.length} de {juntada.personas.length}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
