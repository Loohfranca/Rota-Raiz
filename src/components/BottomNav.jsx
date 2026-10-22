import React from 'react';
import { Navigation, Map, Compass } from 'lucide-react';

export default function BottomNav({ activeTab, onChangeTab }) {
  const tabs = [
    { id: 'routes', label: 'Rotas', icon: Navigation },
    { id: 'map', label: 'Mapa', icon: Map },
    { id: 'tours', label: 'Passeios', icon: Compass },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fff8f4]/95 backdrop-blur-md border-t border-[#e0d5c1] px-4 py-1.5 flex items-center justify-around shadow-lg safe-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`
              flex-1 min-h-[44px] flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative
              ${isActive ? 'text-[#c2461f] font-bold' : 'text-[#59413b] font-medium'}
            `}
          >
            <div className="relative flex items-center justify-center">
              <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
            </div>
            <span className="text-[11px] mt-0.5 leading-none">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
