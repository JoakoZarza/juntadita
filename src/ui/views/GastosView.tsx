import React, { useState } from 'react';
import { Lock, Trash2, Users, Wallet } from 'lucide-react';
import { formatearMonto } from '../../core/whatsapp';
import { CategoriaGasto, Gasto, Juntada } from '../../core/types';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Modal } from '../components/Modal';

export interface GastosViewProps {
  juntada: Juntada;
  onEliminarGasto: (gastoId: string) => { ok: true } | { ok: false; error: string };
  onCargarGasto?: () => void;
}

type FiltroCategoria = 'Todos' | CategoriaGasto;

export const GastosView: React.FC<GastosViewProps> = ({
  juntada,
  onEliminarGasto,
  onCargarGasto,
}) => {
  const [filtro, setFiltro] = useState<FiltroCategoria>('Todos');
  const [gastoABorrar, setGastoABorrar] = useState<Gasto | null>(null);

  const categoriasFiltro: FiltroCategoria[] = ['Todos', 'Asado', 'Fútbol', 'Bebidas', 'Otros'];

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

  const handleConfirmarBorrado = () => {
    if (!gastoABorrar) return;
    onEliminarGasto(gastoABorrar.id);
    setGastoABorrar(null);
  };

  const totalGastadoFiltrado = gastosFiltrados.reduce((sum, g) => sum + g.monto_total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Estado de juntada cerrada: cartel con ícono Lock */}
      {juntada.estado === 'cerrada' && (
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(245, 166, 35, 0.1)',
            borderColor: 'rgba(245, 166, 35, 0.3)',
            color: 'var(--accent-amber)',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <Lock size={18} />
          <span>Juntada cerrada. Cuentas congeladas.</span>
        </div>
      )}

      {/* Cabecera del tab */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <div className="screen-title" style={{ marginBottom: 0 }}>
          <Wallet size={22} color="var(--accent-coral)" />
          <span>Gastos ({juntada.gastos.length})</span>
        </div>

        {totalGastadoFiltrado > 0 && (
          <div style={{ textAlign: 'right' }}>
            <span
              className="font-title tabular-nums"
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--accent-coral)',
              }}
            >
              ${formatearMonto(totalGastadoFiltrado)}
            </span>
          </div>
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
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '48px 20px',
            color: 'var(--text-secondary)',
            gap: '12px',
          }}
        >
          {juntada.estado === 'cerrada' ? (
            <>
              <Lock size={40} color="var(--accent-amber)" strokeWidth={1.5} />
              <p style={{ fontSize: '15px', maxWidth: '280px', color: 'var(--accent-amber)' }}>
                Juntada cerrada. Cuentas congeladas.
              </p>
            </>
          ) : (
            <>
              <Wallet size={40} color="var(--text-muted)" strokeWidth={1.5} />
              <p style={{ fontSize: '15px', maxWidth: '280px' }}>
                {filtro === 'Todos'
                  ? 'Todavía no hay gastos cargados. Tocá el botón + para sumar el primero.'
                  : `No hay gastos registrados en la categoría ${filtro}.`}
              </p>
              {filtro === 'Todos' && onCargarGasto && (
                <Button
                  variant="primary"
                  onClick={onCargarGasto}
                  style={{ marginTop: '8px' }}
                >
                  Cargar primer gasto
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {gastosFiltrados.map((gasto) => {
            const hora = formatHora(gasto.created_at);
            const tituloGasto = gasto.descripcion?.trim() ? gasto.descripcion.trim() : gasto.categoria;

            return (
              <div key={gasto.id} className="gasto-card">
                {/* Fila superior: Chip + hora a la izquierda, Botón Trash2 arriba a la derecha */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Chip
                      label={gasto.categoria}
                      categoria={gasto.categoria}
                      size="sm"
                      active
                    />
                    {hora && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-title)',
                        }}
                      >
                        {hora}
                      </span>
                    )}
                  </div>

                  {juntada.estado === 'abierta' && (
                    <button
                      type="button"
                      onClick={() => setGastoABorrar(gasto)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        padding: '4px',
                        borderRadius: 'var(--radius-sm)',
                        minHeight: '32px',
                        minWidth: '32px',
                      }}
                      title="Borrar gasto"
                      aria-label="Borrar gasto"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Fila central: Descripción en blanco a la izq, Monto tabular 24px blanco a la der */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      wordBreak: 'break-word',
                      flex: 1,
                    }}
                  >
                    {tituloGasto}
                  </span>

                  <span
                    className="font-title tabular-nums"
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ${formatearMonto(gasto.monto_total)}
                  </span>
                </div>

                {/* Fila inferior: Aportantes a la izquierda, Badge con Users a la derecha */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                    title={formatTextoAportantes(gasto)}
                  >
                    {formatTextoAportantes(gasto)}
                  </span>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Users size={13} />
                    <span className="tabular-nums">
                      {gasto.participantes_ids.length}/{juntada.personas.length} pers
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmación para eliminar gasto */}
      <Modal
        isOpen={gastoABorrar !== null}
        onClose={() => setGastoABorrar(null)}
        title="Borrar gasto"
        actions={
          <>
            <Button variant="secondary" onClick={() => setGastoABorrar(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmarBorrado}>
              Borrar
            </Button>
          </>
        }
      >
        ¿Borrar este gasto? Se va a recalcular todo.
      </Modal>
    </div>
  );
};
