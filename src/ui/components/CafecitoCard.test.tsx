import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CafecitoCard } from './CafecitoCard';

describe('CafecitoCard', () => {
  it('no se muestra mientras no haya link configurado', () => {
    const { container } = render(<CafecitoCard url="" />);
    expect(container.innerHTML).toBe('');
  });

  it('abre el link de Cafecito en otra pestaña', () => {
    render(<CafecitoCard url="https://cafecito.app/juntadita" />);
    const link = screen.getByRole('link', { name: 'Invitar' });
    expect(link.getAttribute('href')).toBe('https://cafecito.app/juntadita');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });
});
