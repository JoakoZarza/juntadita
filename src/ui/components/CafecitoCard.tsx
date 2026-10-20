import React from 'react';
import { Coffee } from 'lucide-react';

export interface CafecitoCardProps {
  url: string;
}

/**
 * Invitación discreta a apoyar el proyecto. Abre Cafecito en otra pestaña
 * para no perder la juntada en curso.
 */
export const CafecitoCard: React.FC<CafecitoCardProps> = ({ url }) => {
  if (!url) return null;

  return (
    <aside className="card cafecito-card" aria-label="Apoyar Juntadita">
      <span className="cafecito-icono" aria-hidden="true">
        <Coffee size={20} />
      </span>
      <div className="stack gap-3 flex-1">
        <span className="fw-600 c-primary text-sm">¿Te sirvió Juntadita?</span>
        <span className="text-xs c-secondary">
          Es gratis y sin publicidad. Si querés, invitame un cafecito.
        </span>
      </div>
      <a
        className="btn btn-outline btn-sm btn-pill"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        Invitar
      </a>
    </aside>
  );
};
