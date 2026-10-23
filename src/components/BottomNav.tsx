import React from 'react';
import { useApp } from '../context/AppContext';

interface NavItem {
  id: 'dashboard' | 'leads' | 'follow-ups' | 'reports' | 'team';
  label: string;
  icon: string;
  badge?: number;
}

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setSelectedLeadId, followups } = useApp();

  const pendingFollowupsCount = followups.filter((f) => !f.completed && f.bucket === 'today').length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'leads', label: 'Leads', icon: 'group' },
    { id: 'follow-ups', label: 'Follow-ups', icon: 'event_upcoming', badge: pendingFollowupsCount },
    { id: 'reports', label: 'Reports', icon: 'query_stats' },
    { id: 'team', label: 'Team', icon: 'shield_person' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 pb-safe bg-surface-container-lowest/90 backdrop-blur-xl border-t border-surface-container/60 shadow-[0_-1px_8px_rgba(0,0,0,0.04)] md:hidden">
      <div className="h-16 px-gutter flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSelectedLeadId(null);
              }}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-1 transition-colors relative ${
                isActive ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-primary'
              }`}
              type="button"
            >
              <div className="relative">
                <span className="material-symbols-outlined text-[24px]">
                  {item.icon}
                </span>
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
