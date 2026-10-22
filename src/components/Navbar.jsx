import React from 'react';
import { Compass, Database, Wifi, WifiOff } from 'lucide-react';
import { TABS } from './BottomNav';
import UserProfile from './UserProfile';

export default function Navbar({ activeTab, onChangeTab, isOnline, dataSource, user, onLogout }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFF8F4]/95 backdrop-blur-md border-b border-[#E0D5C1]">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#C2461F] text-white flex items-center justify-center shrink-0">
            <Compass size={20} className="stroke-[2.5]" />
          </div>
          <span className="font-headline font-bold text-lg text-[#C2461F] tracking-tight">
            Rota Raiz
          </span>
        </div>

        {/* Abas (somente telas maiores) */}
        <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-h-[44px] px-4 rounded-xl text-sm flex items-center gap-2 ${
                  isActive ? 'bg-[#C2461F] text-white font-bold' : 'text-[#201B15] font-medium hover:bg-[#F7ECE2]'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Status */}
        <div className="flex items-center gap-2 shrink-0">
          {user && <UserProfile user={user} onLogout={onLogout} />}

          {/* Status real, discreto */}
          <div className="flex items-center gap-2 text-xs font-bold">
          <span
            title={isOnline ? 'Com internet' : 'Sem internet: usando dados salvos'}
            className={`flex items-center gap-1 ${isOnline ? 'text-[#2F5D3A]' : 'text-[#BA1A1A]'}`}
          >
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            {!isOnline && <span>Offline</span>}
          </span>
            <span
              title={dataSource === 'supabase' ? 'Dados do Supabase' : 'Modo local (sem banco)'}
              className="flex items-center gap-1 text-[#59413B]"
            >
              <Database size={15} className={dataSource === 'supabase' ? 'text-[#2F5D3A]' : 'text-[#E9B62F]'} />
              <span className="hidden sm:inline">{dataSource === 'supabase' ? 'Banco' : 'Modo local'}</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
