import React from 'react';
import { CheckCheck, Users, Wallet } from 'lucide-react';

export type TabId = 'gastos' | 'personas' | 'resumen';

export interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  personasCount?: number;
  gastosCount?: number;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabChange,
  personasCount,
  gastosCount,
}) => {
  const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode; badge?: number }> = [
    {
      id: 'gastos',
      label: 'Gastos',
      icon: <Wallet size={18} />,
      badge: gastosCount,
    },
    {
      id: 'personas',
      label: 'Personas',
      icon: <Users size={18} />,
      badge: personasCount,
    },
    {
      id: 'resumen',
      label: 'Resumen',
      icon: <CheckCheck size={18} />,
    },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: '480px',
        margin: '0 auto',
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '6px 12px calc(6px + var(--safe-bottom)) 12px',
        minHeight: '62px',
        zIndex: 40,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              minHeight: '48px',
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isActive ? 'var(--accent-coral)' : 'transparent',
              color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {tab.icon}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: isActive ? 'rgba(0,0,0,0.25)' : 'var(--bg-card)',
                    color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-full)',
                    border: isActive ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: '12px',
                fontWeight: isActive ? 600 : 500,
                fontFamily: 'var(--font-title)',
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
