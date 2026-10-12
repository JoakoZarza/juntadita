import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface UsePWAInstallReturn {
  canInstall: boolean; // true si el navegador disparó beforeinstallprompt
  installed: boolean; // true si la app ya está instalada
  isIOS: boolean; // true si el navegador es iOS Safari
  promptInstall: () => Promise<void>; // dispara el diálogo nativo de instalación
}

function checkIsIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIosDevice = /iPhone|iPad|iPod/.test(ua);
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isIosDevice || isIPadOS;
}

function checkIsInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  const hasMatchMedia =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  const hasNavigatorStandalone =
    typeof window.navigator !== 'undefined' &&
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(hasMatchMedia || hasNavigatorStandalone);
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(() => checkIsInstalled());
  const [isIOS] = useState<boolean>(() => checkIsIOS());

  useEffect(() => {
    // Si ya está corriendo en modo standalone, marcar como instalada
    if (checkIsInstalled()) {
      setInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Suprimir mini-infobar automático del navegador
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
        setDeferredPrompt(null);
      }
    } catch {
      // En caso de rechazo o error del navegador, limpiar estado
      setDeferredPrompt(null);
    }
  };

  return {
    canInstall: deferredPrompt !== null && !installed,
    installed,
    isIOS,
    promptInstall,
  };
}
