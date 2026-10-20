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
    <div className="stack gap-20">
      {/* SECCIÓN 1: Estado de la juntada */}
      <div className="tab-header">
        <div className="screen-title">
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
          <div className="stack gap-4">
            <span className="text-sm fw-600 c-secondary">Fondo total de la juntada</span>
            <span className="monto resumen-total-monto">${formatearMonto(totalGeneral)}</span>
            <span className="text-sm c-secondary resumen-promedio">
              Promedio por cabeza:{' '}
              <strong className="c-primary tabular-nums">
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
        <div className="stack gap-8">
          <span className="section-label">Totales por categoría</span>
          <div className="stack gap-8">
            {categoriasConGasto.map((cat) => (
              <div key={cat} className="categoria-row">
                <div className="row gap-8">
                  <Chip
                    label={cat}
                    categoria={cat}
                    size="sm"
                    active
                  />
                </div>

                <span className="monto text-base c-primary">
                  ${formatearMonto(liquidacion!.totales.por_categoria[cat])}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN 4: Transferencias directas minimizadas */}
      {hayGastos && (
        <div className="stack gap-10">
          <div className="row-between">
            <span className="section-label">Transferencias</span>
            {liquidacion && liquidacion.transferencias.length > 0 && (
              <span className="text-xs c-muted">
                {liquidacion.transferencias.length}{' '}
                {liquidacion.transferencias.length === 1 ? 'pago' : 'pagos'}
              </span>
            )}
          </div>

          {liquidacion && liquidacion.transferencias.length === 0 ? (
            <div className="card card-vacia card-vacia-sm c-emerald text-sm fw-600">
              No hay transferencias pendientes. ¡Todos al día!
            </div>
          ) : (
            <div className="stack gap-8">
              {liquidacion?.transferencias.map((t, idx) => {
                const acreedor = juntada.personas.find((p) => p.id === t.to_persona_id);
                return (
                  <div
                    key={`${t.from_persona_id}-${t.to_persona_id}-${idx}`}
                    className="card transferencia-card"
                  >
                    <div className="stack gap-3">
                      <div className="row gap-8">
                        <span className="nombre">{t.from_apodo}</span>
                        <span className="text-sm c-secondary">→</span>
                        <span className="nombre">{t.to_apodo}</span>
                      </div>
                      {acreedor?.alias_cobro && (
                        <span className="text-xs c-secondary mono">
                          alias: {acreedor.alias_cobro}
                        </span>
                      )}
                    </div>

                    <span className="monto text-lg c-coral">${formatearMonto(t.monto)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 5: Balances individuales */}
      <div className="stack gap-10">
        <span className="section-label">Balances individuales</span>

        <div className="stack gap-8">
          {juntada.personas.map((persona) => {
            const balance = getBalancePersona(persona.id);

            let claseBalance = 'c-muted';
            let textoMonto = '$0';

            if (balance.tipo === 'acreedor') {
              claseBalance = 'c-emerald';
              textoMonto = `+$${formatearMonto(balance.monto)}`;
            } else if (balance.tipo === 'deudor') {
              claseBalance = 'c-coral';
              textoMonto = `-$${formatearMonto(balance.monto)}`;
            }

            return (
              <div key={persona.id} className="balance-row">
                <div className="row gap-10">
                  <div className="avatar-circle avatar-solo">
                    {persona.apodo.charAt(0).toUpperCase()}
                  </div>
                  <div className="row gap-6">
                    <span className="nombre">{persona.apodo}</span>
                    {persona.es_organizador && (
                      <span className="badge-organizador">Organizador</span>
                    )}
                  </div>
                </div>

                <span className={`monto text-lg ${claseBalance}`}>{textoMonto}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 6: Mensaje final para WhatsApp */}
      {hayGastos ? (
        <div className="stack gap-12">
          <span className="section-label">Mensaje para el grupo</span>

          <div className="mensaje-bloque">{mensajeWhatsApp}</div>

          <Button
            variant="primary"
            fullWidth
            icon={copiado ? <Check size={18} /> : <Copy size={18} />}
            onClick={handleCopiarMensaje}
            className={copiado ? 'btn-exito' : ''}
          >
            {copiado ? 'Copiado' : 'Copiar mensaje'}
          </Button>
        </div>
      ) : (
        <div className="card card-vacia">
          <span className="text-sm">Cargá gastos para ver la liquidación</span>
        </div>
      )}

      {/* SECCIÓN 6: Acciones de cierre y exportación */}
      <div className="resumen-acciones">
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

        <div className="flex gap-8">
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
          hidden
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
        <div className="stack gap-10">
          <p>Esto reemplaza tu juntada actual. ¿Querés exportar la actual antes?</p>
          {errorImport && <div className="error-box text-sm">{errorImport}</div>}
        </div>
      </Modal>
    </div>
  );
};
