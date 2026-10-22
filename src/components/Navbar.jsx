import React from 'react';
import { 
  Compass, 
  MapPin, 
  Database, 
  Wifi, 
  WifiOff, 
  Menu,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ 
  currentRegion,
  onOpenRegionModal,
  isOnline,
  dataSource,
  onToggleSidebar
}) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFF8F4]/95 backdrop-blur-md border-b border-[#E0D5C1] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#59413B] hover:bg-[#F7ECE2] transition-colors"
            aria-label="Abrir menu lateral"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#C2461F] text-white flex items-center justify-center shadow-xs shrink-0">
              <Compass size={22} className="stroke-[2.5]" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline font-bold text-lg text-[#C2461F] tracking-tight leading-none">
                  Rota Raiz
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#ECE1D7] text-[#59413B] shrink-0">
                  {currentRegion.state || 'BA'}
                </span>
              </div>
              <span className="text-[11px] text-[#59413B] font-medium truncate">
                {currentRegion.name}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Region Switcher Pill */}
        <div className="hidden sm:flex items-center">
          <button
            onClick={onOpenRegionModal}
            className="min-h-[44px] px-4 rounded-full bg-[#F7ECE2] hover:bg-[#ECE1D7] text-[#201B15] text-xs font-bold flex items-center gap-2 border border-[#E0D5C1] transition-all shadow-xs"
          >
            <MapPin size={15} className="text-[#C2461F]" />
            <span>Região: <strong>{currentRegion.shortName}</strong></span>
            <ChevronDown size={14} className="text-[#59413B]" />
          </button>
        </div>

        {/* Right: Real Status Indicators (Online/Offline + Fonte de Dados) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Status Online/Offline */}
          <div 
            title={isOnline ? 'Conectado à internet' : 'Sem conexão com a internet'}
            className={`min-h-[36px] px-2.5 sm:px-3 rounded-full flex items-center gap-1.5 text-xs font-bold border ${
              isOnline 
                ? 'bg-[#EBF7EE] text-[#2F5D3A] border-[#BBECF1]' 
                : 'bg-[#FFDAD6] text-[#BA1A1A] border-[#FFDAD6]'
            }`}
          >
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Fonte dos dados */}
          <div 
            title={dataSource === 'supabase' ? 'Dados sincronizados com o Supabase' : 'Rodando localmente com dados de seed'}
            className="min-h-[36px] px-2.5 sm:px-3 rounded-full flex items-center gap-1.5 text-xs font-bold border border-[#E0D5C1] bg-[#F7ECE2] text-[#59413B]"
          >
            <Database size={13} className={dataSource === 'supabase' ? 'text-[#2F5D3A]' : 'text-[#E9B62F]'} />
            <span className="hidden md:inline">{dataSource === 'supabase' ? 'Supabase' : 'Modo local (sem banco)'}</span>
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: dataSource === 'supabase' ? '#22c55e' : '#f59e0b' }} 
            />
          </div>
        </div>
      </div>
    </header>
  );
}
