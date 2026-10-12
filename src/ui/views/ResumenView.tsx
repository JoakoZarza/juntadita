import React, { useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Lock,
  PieChart,
  Upload,
} from 'lucide-react';
import { calcularLiquidacionMinimizada } from '../../core/balance';
import { formatearMonto, generarMensajeWhatsAppMinimizado } from '../../core/whatsapp';
import { CategoriaGasto, Juntada } from '../../core/types';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Modal } from '../components/Modal';

export interface ResumenViewProps {
  juntada: Juntada;
  onCerrarJuntada: () => { ok: true } | { ok: false; error: string };
  onReabrirJuntada: () => { ok: true } | { ok: false; error: string };
  onExportarJuntada: () => void;
  onImportarJuntada: (file: File) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export const ResumenView: React.FC<ResumenViewProps> = ({
  juntada,
  onCerrarJuntada,
  onReabrirJuntada,
  onExportarJuntada,
  onImportarJuntada,
}) => {
  const [copiado, setCopiado] = useState(false);
  const [modalCierreAbierto, setModalCierreAbierto] = useState(false);
  const [modalReaperturaAbierto, setModalReaperturaAbierto] = useState(false);
  const [modalImportAbierto, setModalImportAbierto] = useState(false);
  const [archivoAImportar, setArchivoAImportar] = useState<File | null>(null);
  const [errorImport, setErrorImport] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hayGastos = juntada.gastos.length > 0;

  // Cálculo financiero estricto con minimización de transferencias P2P
  const liquidacion = hayGastos
    ? calcularLiquidacionMinimizada(juntada.personas, juntada.gastos)
    : null;

  // Mensaje final para WhatsApp con transferencias minimizadas
  const mensajeWhatsApp =
    hayGastos && liquidacion
      ? generarMensajeWhatsAppMinimizado({
          nombreJuntada: juntada.nombre,
          personas: juntada.personas,
          liquidacion,
        })
      : '';

  // Función de copiado con fallback a execCommand
  const handleCopiarMensaje = async () => {
    if (!mensajeWhatsApp) return;

    let exito = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(mensajeWhatsApp);
        exito = true;
      } else {
        throw new Error('Fallback a execCommand');
      }
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = mensajeWhatsApp;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        exito = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        exito = false;
      }
    }

    if (exito) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  // Mapeo rápido de balances individuales
  const mapaBalances = new Map(
    liquidacion?.balances_individuales.map((b) => [b.persona_id, b.saldo]) || []
  );

  const getBalancePersona = (personaId: string) => {
    if (!hayGastos || !liquidacion) {
      return { tipo: 'cero' as const, monto: 0 };
    }

    const saldo = mapaBalances.get(personaId) || 0;
    if (saldo > 0) return { tipo: 'acreedor' as const, monto: saldo };
    if (saldo < 0) return { tipo: 'deudor' as const, monto: Math.abs(saldo) };
    return { tipo: 'cero' as const, monto: 0 };
  };

  // Promedio por cabeza
  const totalGeneral = liquidacion?.totales.total_general || 0;
  const promedioPorCabeza =
    juntada.personas.length > 0 ? Math.round(totalGeneral / juntada.personas.length) : 0;

  // Manejo de importación
  const handleArchivoSeleccionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArchivoAImportar(file);
    setErrorImport(null);
    setModalImportAbierto(true);
    e.target.value = '';
  };

  const ejecutarImportacion = async (exportarPrimero: boolean) => {
    if (!archivoAImportar) return;

    if (exportarPrimero) {
      onExportarJuntada();
    }

    const res = await onImportarJuntada(archivoAImportar);
    if (res.ok) {
      setModalImportAbierto(false);
      setArchivoAImportar(null);
    } else {
      setErrorImport(res.error);
    }
  };

  const categoriasConGasto: CategoriaGasto[] = (
    ['Asado', 'Fútbol', 'Bebidas', 'Otros'] as CategoriaGasto[]
  ).filter((cat) => (liquidacion?.totales.por_categoria[cat] || 0) > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* SECCIÓN 1: Estado de la juntada */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div className="screen-title" style={{ marginBottom: 0 }}>
          <PieChart size={22} color="var(--accent-coral)" />
          <span>Resumen de cuentas</span>
        </div>

        {juntada.estado === 'abierta' ? (
          <div className="estado-badge-abierta">
            <Check size={14} strokeWidth={2.5} />
            <span>Abierta</span>
          </div>
        ) : (
          <div className="estado-badge-cerrada">
            <Lock size={14} strokeWidth={2.5} />
            <span>Cerrada</span>
          </div>
        )}
      </div>

      {/* SECCIÓN 2: Card de total general (destacado con gradiente) */}
      {hayGastos && (
        <div className="resumen-total-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Fondo total de la juntada
            </span>
            <span
              className="font-title tabular-nums"
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#FFFFFF',
                lineHeight: 1.1,
              }}
            >
              ${formatearMonto(totalGeneral)}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Promedio por cabeza:{' '}
              <strong style={{ color: 'var(--text-primary)' }} className="tabular-nums">
                ${formatearMonto(promedioPorCabeza)}
              </strong>
            </span>
          </div>

          {/* Avatares superpuestos */}
          <div className="avatar-stack">
            {juntada.personas.slice(0, 5).map((p) => (
              <div key={p.id} className="avatar-circle" title={p.apodo}>
                {p.apodo.charAt(0).toUpperCase()}
              </div>
            ))}
            {juntada.personas.length > 5 && (
              <div className="avatar-circle avatar-more">
                +{juntada.personas.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN 3: Totales por categoría */}
      {hayGastos && categoriasConGasto.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Totales por categoría
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categoriasConGasto.map((cat) => (
              <div key={cat} className="categoria-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Chip
                    label={cat}
                    categoria={cat}
                    size="sm"
                    active
                  />
                </div>

                <span
                  className="font-title tabular-nums"
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  ${formatearMonto(liquidacion!.totales.por_categoria[cat])}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN 4: Transferencias directas minimizadas */}
      {hayGastos && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Transferencias
            </span>
            {liquidacion && liquidacion.transferencias.length > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {liquidacion.transferencias.length}{' '}
                {liquidacion.transferencias.length === 1 ? 'pago' : 'pagos'}
              </span>
            )}
          </div>

          {liquidacion && liquidacion.transferencias.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '20px 16px',
                color: 'var(--accent-emerald)',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              No hay transferencias pendientes. ¡Todos al día!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {liquidacion?.transferencias.map((t, idx) => {
                const acreedor = juntada.personas.find((p) => p.id === t.to_persona_id);
                return (
                  <div
                    key={`${t.from_persona_id}-${t.to_persona_id}-${idx}`}
                    className="card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {t.from_apodo}
                        </span>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>→</span>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {t.to_apodo}
                        </span>
                      </div>
                      {acreedor?.alias_cobro && (
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            fontFamily: 'monospace',
                          }}
                        >
                          alias: {acreedor.alias_cobro}
                        </span>
                      )}
                    </div>

                    <span
                      className="font-title tabular-nums"
                      style={{
                        fontSize: '17px',
                        fontWeight: 700,
                        color: 'var(--accent-coral)',
                      }}
                    >
                      ${formatearMonto(t.monto)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 5: Balances individuales */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Balances individuales
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {juntada.personas.map((persona) => {
            const balance = getBalancePersona(persona.id);

            let colorBalance = 'var(--text-muted)';
            let textoMonto = '$0';

            if (balance.tipo === 'acreedor') {
              colorBalance = 'var(--accent-emerald)';
              textoMonto = `+$${formatearMonto(balance.monto)}`;
            } else if (balance.tipo === 'deudor') {
              colorBalance = 'var(--accent-coral)';
              textoMonto = `-$${formatearMonto(balance.monto)}`;
            }

            return (
              <div key={persona.id} className="balance-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="avatar-circle" style={{ margin: 0 }}>
                    {persona.apodo.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {persona.apodo}
                    </span>
                    {persona.es_organizador && (
                      <span className="badge-organizador" style={{ fontSize: '11px' }}>
                        Organizador
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className="font-title tabular-nums"
                  style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: colorBalance,
                  }}
                >
                  {textoMonto}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 6: Mensaje final para WhatsApp */}
      {hayGastos ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Mensaje para el grupo
          </span>

          <div className="mensaje-bloque">{mensajeWhatsApp}</div>

          <Button
            variant="primary"
            fullWidth
            icon={copiado ? <Check size={18} color="#10B981" /> : <Copy size={18} />}
            onClick={handleCopiarMensaje}
            style={
              copiado
                ? {
                    backgroundColor: 'rgba(16, 185, 129, 0.18)',
                    borderColor: 'var(--accent-emerald)',
                    color: 'var(--accent-emerald)',
                  }
                : undefined
            }
          >
            {copiado ? 'Copiado' : 'Copiar mensaje'}
          </Button>
        </div>
      ) : (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '32px 16px',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ fontSize: '14px' }}>Cargá gastos para ver la liquidación</span>
        </div>
      )}

      {/* SECCIÓN 6: Acciones de cierre y exportación */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {juntada.estado === 'abierta' ? (
          <Button
            variant="primary"
            fullWidth
            onClick={() => setModalCierreAbierto(true)}
          >
            Cerrar juntada
          </Button>
        ) : (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setModalReaperturaAbierto(true)}
          >
            Reabrir juntada
          </Button>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            fullWidth
            icon={<Download size={16} />}
            onClick={onExportarJuntada}
          >
            Exportar backup (.json)
          </Button>

          <Button
            variant="secondary"
            fullWidth
            icon={<Upload size={16} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Importar backup
          </Button>
        </div>

        {/* Input file oculto */}
        <input
          type="file"
          accept=".json,application/json"
          ref={fileInputRef}
          onChange={handleArchivoSeleccionado}
          style={{ display: 'none' }}
        />
      </div>

      {/* MODAL 1: Cierre de juntada */}
      <Modal
        isOpen={modalCierreAbierto}
        onClose={() => setModalCierreAbierto(false)}
        title="¿Cerrar la juntada?"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalCierreAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onCerrarJuntada();
                setModalCierreAbierto(false);
              }}
            >
              Cerrar
            </Button>
          </>
        }
      >
        No vas a poder agregar más gastos ni personas hasta reabrirla.
      </Modal>

      {/* MODAL 2: Reapertura de juntada */}
      <Modal
        isOpen={modalReaperturaAbierto}
        onClose={() => setModalReaperturaAbierto(false)}
        title="¿Reabrir la juntada?"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalReaperturaAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onReabrirJuntada();
                setModalReaperturaAbierto(false);
              }}
            >
              Reabrir
            </Button>
          </>
        }
      >
        Vas a poder volver a editar gastos y personas.
      </Modal>

      {/* MODAL 3: Confirmación de import con reemplazo */}
      <Modal
        isOpen={modalImportAbierto}
        onClose={() => {
          setModalImportAbierto(false);
          setArchivoAImportar(null);
        }}
        title="Importar backup"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setModalImportAbierto(false);
                setArchivoAImportar(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={() => ejecutarImportacion(true)}
            >
              Exportar actual y seguir
            </Button>
            <Button
              variant="danger"
              onClick={() => ejecutarImportacion(false)}
            >
              Reemplazar sin exportar
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p>Esto reemplaza tu juntada actual. ¿Querés exportar la actual antes?</p>
          {errorImport && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--accent-danger-bg)',
                color: 'var(--accent-danger)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
              }}
            >
              {errorImport}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
