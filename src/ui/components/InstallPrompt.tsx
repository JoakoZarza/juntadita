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
      className={`banner-flotante install-banner ${esModoIOS ? 'banner-ios' : ''}`}
    >
      <div className="row gap-12 flex-1">
        <div className={`install-icono ${isIOS ? 'is-ios' : ''}`}>
          {isIOS && !canInstall ? (
            <Share size={20} strokeWidth={2} />
          ) : (
            <Download size={20} strokeWidth={2} />
          )}
        </div>

        <div className="stack gap-2 flex-1">
          <span className="install-titulo">Instalá Juntadita en tu celu</span>
          <span className="install-texto">
            {isIOS && !canInstall
              ? 'Tocá el botón Compartir y elegí Añadir a pantalla de inicio'
              : 'Acceso directo, sin navegador, funciona offline'}
          </span>
        </div>
      </div>

      <div className="row gap-4 shrink-0">
        {canInstall && (
          <button type="button" onClick={handlePromptInstall} className="install-btn">
            Instalar
          </button>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar aviso de instalación"
          className="install-cerrar"
        >
          <X size={18} />
        </button>
      </div>
    </aside>
  );
};
