import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

const Explota = () => {
  throw new Error('boom');
};

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza los hijos cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <p>todo bien</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('todo bien')).toBeTruthy();
  });

  it('muestra la pantalla de rescate cuando un hijo falla', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Explota />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Algo salió mal')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Descargar mis datos' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Recargar' })).toBeTruthy();
  });
});
