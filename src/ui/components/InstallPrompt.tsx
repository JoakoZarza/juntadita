import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const DISMISS_KEY = 'juntadita:pwa-install-dismissed';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isDismissed(): boolean {
  try {
    const val = localStorage.getItem(DISMISS_KEY);
    if (!val) return false;
    const timestamp = parseInt(val, 10);
    if (isNaN(timestamp)) return false;
    return Date.now() - timestamp < SEVEN_DAYS_MS;
  } catch {
    return false;
  }
}

export interface InstallPromptProps {
  // Opcionales para facilitar testing o inyección externa
  canInstall?: boolean;
  installed?: boolean;
  isIOS?: boolean;
  onInstall?: () => Promise<void>;
}

export const InstallPrompt: React.FC<InstallPromptProps> = (props) => {
  const pwa = usePWAInstall();

  const canInstall = props.canInstall ?? pwa.canInstall;
  const installed = props.installed ?? pwa.installed;
  const isIOS = props.isIOS ?? pwa.isIOS;
  const handlePromptInstall = props.onInstall ?? pwa.promptInstall;

  const [dismissed, setDismissed] = useState<boolean>(() => isDismissed());

  // Si ya está instalada, no se puede instalar en ningún formato o fue descartado por 7 días
  if (installed || dismissed || (!canInstall && !isIOS)) {
    return null;
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      // Ignore localStorage issues
    }
    setDismissed(true);
  };

  const esModoIOS = isIOS && !canInstall;

  return (
    <aside
      role="banner"
      aria-label="Aviso para instalar la aplicación"
      className={esModoIOS ? 'banner-ios' : undefined}
      style={{
        position: 'fixed',
        bottom: 'calc(76px + var(--safe-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '448px',
        backgroundColor: 'var(--bg-surface)',
        border: esModoIOS
          ? '1.5px solid var(--accent-coral)'
          : '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        zIndex: 85,
        boxShadow: esModoIOS
          ? '0 0 12px -4px rgba(224, 86, 56, 0.35)'
          : '0 8px 24px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: isIOS
              ? 'rgba(245, 166, 35, 0.12)'
              : 'rgba(224, 86, 56, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: isIOS ? 'var(--accent-amber)' : 'var(--accent-coral)',
          }}
        >
          {isIOS && !canInstall ? (
            <Share size={20} strokeWidth={2} />
          ) : (
            <Download size={20} strokeWidth={2} />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-title)',
              lineHeight: 1.2,
            }}
          >
            Instalá Juntadita en tu celu
          </span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              lineHeight: 1.3,
            }}
          >
            {isIOS && !canInstall
              ? 'Tocá el botón Compartir y elegí Añadir a pantalla de inicio'
              : 'Acceso directo, sin navegador, funciona offline'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        {canInstall && (
          <button
            type="button"
            onClick={handlePromptInstall}
            style={{
              backgroundColor: 'var(--accent-coral)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'var(--font-title)',
              cursor: 'pointer',
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Instalar
          </button>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar aviso de instalación"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            minWidth: '48px',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <X size={18} />
        </button>
      </div>
    </aside>
  );
};
