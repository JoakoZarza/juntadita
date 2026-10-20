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
    <nav className="tabbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            className={`tab-btn ${isActive ? 'is-active' : ''}`}
          >
            <div className="row gap-4">
              {tab.icon}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="tab-badge">{tab.badge}</span>
              )}
            </div>

            <span className="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
