import React from 'react';
import { 
  Navigation, 
  Map, 
  Compass, 
  ShieldCheck, 
  MapPin,
  X,
  Wifi,
  WifiOff,
  Database,
  Sliders
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  onClose,
  activeTab,
  onChangeTab,
  currentRegion,
  onOpenRegionModal,
  isOnline,
  dataSource
}) {
  const navItems = [
    { id: 'routes', label: 'Rotas & Itinerários', icon: Navigation, desc: 'Dijkstra multimodal (balsa, van, canoa)' },
    { id: 'map', label: 'Mapa Regional', icon: Map, desc: 'Pontos de embarque e atrativos' },
    { id: 'tours', label: 'Passeios & Atrativos', icon: Compass, desc: 'Como chegar gastando pouco' },
    { id: 'admin', label: 'Área do Administrador', icon: ShieldCheck, desc: 'Cadastrar e confirmar horários' },
  ];

  const handleNavClick = (tabId) => {
    onChangeTab(tabId);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:sticky top-0 md:top-16 z-50 md:z-30
        h-full md:h-[calc(100vh-4rem)]
        w-72 bg-[#FFF8F4] border-r border-[#E0D5C1]
        flex flex-col justify-between p-4 overflow-y-auto
        transition-transform duration-200 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col gap-5">
          {/* Mobile Header with Close button */}
          <div className="flex items-center justify-between md:hidden pb-3 border-b border-[#E0D5C1]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#C2461F] text-white flex items-center justify-center font-bold text-xs">
                RR
              </div>
              <span className="font-headline font-bold text-base text-[#C2461F]">
                Rota Raiz
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#59413B] hover:bg-[#F7ECE2]"
            >
              <X size={20} />
            </button>
          </div>

          {/* Active Region Mini Card */}
          <div className="p-3.5 rounded-2xl bg-[#F7ECE2] border border-[#E0D5C1] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#59413B]">
                Região Ativa
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#C2461F] text-white">
                {currentRegion.state || 'BA'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#C2461F] shrink-0" />
              <span className="font-headline font-bold text-sm text-[#201B15] truncate">
                {currentRegion.name}
              </span>
            </div>
            <button
              onClick={() => {
                onOpenRegionModal();
                if (onClose) onClose();
              }}
              className="mt-1 h-8 rounded-lg bg-white hover:bg-[#ECE1D7] text-[#C2461F] text-xs font-bold flex items-center justify-center gap-1.5 border border-[#E0D5C1] transition-colors"
            >
              <Sliders size={13} />
              <span>Trocar Região</span>
            </button>
          </div>

          {/* Primary Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#59413B] px-2 mb-1">
              Navegação
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full min-h-[44px] p-2.5 rounded-xl flex items-center justify-between text-left transition-all
                    ${isActive 
                      ? 'bg-[#C2461F] text-white shadow-xs font-bold' 
                      : 'text-[#201B15] hover:bg-[#F7ECE2] font-medium'}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={18} className={isActive ? 'text-white' : 'text-[#C2461F]'} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs truncate">{item.label}</span>
                      <span className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-[#59413B]'}`}>
                        {item.desc}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Real Status Indicator at the Bottom (Requested in item 5) */}
        <div className="pt-4 border-t border-[#E0D5C1] flex flex-col gap-2">
          <div className="p-2.5 rounded-xl bg-[#F7ECE2] border border-[#E0D5C1] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#59413B]">
                Conectividade
              </span>
              <span className={`text-[11px] font-bold flex items-center gap-1 ${isOnline ? 'text-[#2F5D3A]' : 'text-[#BA1A1A]'}`}>
                {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#59413B]">Origem dos dados:</span>
              <span className="font-bold text-[#201B15] flex items-center gap-1">
                <Database size={12} className={dataSource === 'supabase' ? 'text-[#2F5D3A]' : 'text-[#E9B62F]'} />
                <span>{dataSource === 'supabase' ? 'Supabase' : 'Modo local (sem banco)'}</span>
              </span>
            </div>
          </div>

          <div className="text-[10px] text-[#59413B] text-center">
            Rota Raiz • Transporte Regional Autêntico
          </div>
        </div>
      </aside>
    </>
  );
}
