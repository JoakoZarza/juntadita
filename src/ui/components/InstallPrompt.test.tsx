import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InstallPrompt } from './InstallPrompt';

describe('InstallPrompt', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('1. No renderiza nada si installed es true', () => {
    const { container } = render(
      <InstallPrompt canInstall={true} installed={true} isIOS={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('2. No renderiza nada si no es instalable ni iOS', () => {
    const { container } = render(
      <InstallPrompt canInstall={false} installed={false} isIOS={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('3. Renderiza banner con botón Instalar cuando canInstall es true', () => {
    const handleInstall = vi.fn().mockResolvedValue(undefined);
    render(
      <InstallPrompt
        canInstall={true}
        installed={false}
        isIOS={false}
        onInstall={handleInstall}
      />
    );

    expect(screen.getByText('Instalá Juntadita en tu celu')).toBeDefined();
    expect(
      screen.getByText('Acceso directo, sin navegador, funciona offline')
    ).toBeDefined();

    const installBtn = screen.getByText('Instalar');
    expect(installBtn).toBeDefined();

    fireEvent.click(installBtn);
    expect(handleInstall).toHaveBeenCalled();
  });

  it('4. Renderiza instrucciones manuales para iOS', () => {
    render(<InstallPrompt canInstall={false} installed={false} isIOS={true} />);

    expect(screen.getByText('Instalá Juntadita en tu celu')).toBeDefined();
    expect(
      screen.getByText('Tocá el botón Compartir y elegí Añadir a pantalla de inicio')
    ).toBeDefined();
    expect(screen.queryByText('Instalar')).toBeNull();
  });

  it('5. Cierra el banner y lo guarda en localStorage al presionar X', () => {
    const { container } = render(
      <InstallPrompt canInstall={true} installed={false} isIOS={false} />
    );

    const closeBtn = screen.getByLabelText('Cerrar aviso de instalación');
    expect(closeBtn).toBeDefined();

    fireEvent.click(closeBtn);

    expect(container.firstChild).toBeNull();
    expect(
      window.localStorage.getItem('juntadita:pwa-install-dismissed')
    ).not.toBeNull();
  });
});
