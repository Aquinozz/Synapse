import React from 'react';
import { ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'inicio', label: 'Início', icon: 'grid_view' },
    { id: 'bem-estar', label: 'Bem-Estar', icon: 'spa' },
    { id: 'especialistas', label: 'Terapeutas', icon: 'clinical_notes' },
    { id: 'synapse-ai', label: 'Synapse AI', icon: 'neurology' },
    { id: 'gestao', label: 'Gestão', icon: 'monitoring' },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom,0px)] bg-[#f8f9ff]/90 backdrop-blur-xl border-t border-black/[0.04] shadow-[0_-2px_12px_rgba(15,23,42,0.04)]">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex justify-around items-center h-16 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-[44px] min-h-[44px] transition-all duration-200 outline-none ${
                isActive
                  ? 'text-[#6b38d4] font-bold scale-105'
                  : 'text-[#494454] hover:text-[#0b1c30]'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[24px] ${isActive ? 'fill-1' : ''}`}
              >
                {tab.icon}
              </span>
              <span className="font-outfit text-[11px] leading-tight font-medium mt-0.5 tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
