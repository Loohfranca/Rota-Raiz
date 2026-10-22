import React from 'react';
import { Navigation, Map, Compass } from 'lucide-react';

export const TABS = [
  { id: 'routes', label: 'Rotas', icon: Navigation },
  { id: 'map', label: 'Mapa', icon: Map },
  { id: 'tours', label: 'Passeios', icon: Compass },
];

// Navegação inferior (celular). No desktop as abas ficam no topo (Navbar).
export default function BottomNav({ activeTab, onChangeTab }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fff8f4]/95 backdrop-blur-md border-t border-[#e0d5c1] px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] flex items-stretch"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex-1 min-h-[56px] flex flex-col items-center justify-center gap-0.5 rounded-xl ${
              isActive ? 'text-[#c2461f] font-bold' : 'text-[#59413b] font-medium'
            }`}
          >
            <Icon size={22} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
            <span className="text-xs leading-none">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
