import React, { useState } from 'react';
import { REGIONS } from '../data/regionsData';
import { MapPin, Sparkles, Check, X, PlusCircle } from 'lucide-react';

export default function RegionModal({
  isOpen,
  onClose,
  currentRegion,
  onSelectRegion
}) {
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom'

  // Custom region form state
  const [customName, setCustomName] = useState('');
  const [customHeadline, setCustomHeadline] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customState, setCustomState] = useState('');
  const [customCity, setCustomCity] = useState('');

  if (!isOpen) return null;

  const handleCreateCustom = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newRegion = {
      id: 'custom-' + Date.now(),
      name: customName.trim(),
      shortName: customName.split(' ')[0],
      state: customState.trim().toUpperCase() || 'BR',
      headline: customHeadline.trim() || `Partiu ${customName.trim()}`,
      subtitle: customSubtitle.trim() || 'Transporte regional, vans e barcos autênticos.',
      defaultCity: customCity.trim() || 'Centro / Ponto das Vans',
      centerLat: -14.235,
      centerLng: -51.925,
      zoom: 9,
      cities: [
        { id: 'c1', name: customCity.trim() || 'Ponto Central', label: customCity.trim() || 'Central', lat: -14.235, lng: -51.925 },
        { id: 'c2', name: 'Atração / Praia Principal', label: 'Atração', lat: -14.285, lng: -51.905 },
      ],
      frequentDestinations: [
        {
          id: 'dest-custom-1',
          name: 'Atração / Ponto Turístico',
          modalSubtitle: 'Van Regional ou Ônibus Local',
          duration: '~ 40 min',
          priceEstimate: 'R$ 15 a R$ 25',
          frequency: 'A cada 30 min',
          tag: 'Personalizada',
          originId: 'c1',
          destId: 'c2',
        },
      ],
    };

    onSelectRegion(newRegion);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content p-5 flex flex-col gap-4 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e0d5c1]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#c2461f] text-white flex items-center justify-center">
              <MapPin size={18} />
            </div>
            <div>
              <h2 className="font-headline font-bold text-base text-[#201b15]">
                Escolha ou Personalize sua Região
              </h2>
              <span className="text-xs text-[#59413b]">
                O aplicativo adapta rotas, dashboard e mapa para qualquer lugar
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#201b15] hover:bg-[#f7ece2]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-[#f7ece2] p-1 border border-[#e0d5c1]">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'presets' ? 'bg-[#c2461f] text-white shadow-xs' : 'text-[#59413b] hover:text-[#201b15]'
            }`}
          >
            Regiões Populares do Brasil
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'custom' ? 'bg-[#c2461f] text-white shadow-xs' : 'text-[#59413b] hover:text-[#201b15]'
            }`}
          >
            <Sparkles size={13} />
            <span>Criar / Personalizar Região</span>
          </button>
        </div>

        {/* Presets List */}
        {activeTab === 'presets' ? (
          <div className="flex flex-col gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
            {REGIONS.map((reg) => {
              const isSelected = currentRegion.id === reg.id;
              return (
                <button
                  key={reg.id}
                  onClick={() => {
                    onSelectRegion(reg);
                    onClose();
                  }}
                  className={`
                    p-3.5 rounded-2xl flex items-center justify-between text-left transition-all border
                    ${isSelected 
                      ? 'bg-[#ffdbd1] border-[#c2461f] shadow-xs' 
                      : 'bg-[#ffffff] border-[#e0d5c1] hover:bg-[#fdf2e7]'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface-container-high)',
                        color: isSelected ? '#ffffff' : 'var(--on-surface-variant)',
                      }}
                    >
                      <MapPin size={18} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`font-headline font-bold text-sm ${isSelected ? 'text-[#c2461f]' : 'text-[#201b15]'}`}>
                          {reg.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#f7ece2] text-[#59413b]">
                          {reg.state}
                        </span>
                      </div>
                      <span className="text-xs text-[#59413b] mt-0.5">
                        {reg.subtitle}
                      </span>
                      <span className="text-[11px] text-[#2f5d3a] font-medium mt-1">
                        Base inicial: {reg.defaultCity}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#c2461f] text-white flex items-center justify-center shrink-0">
                      <Check size={14} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Custom Region Creator Form */
          <form onSubmit={handleCreateCustom} className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-1">
            <div>
              <label className="text-[11px] font-bold text-[#59413b] uppercase block mb-1">
                Nome da Região ou Cidade
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Ilha Grande & Angra, Serra do Cipó, Jalapão..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl text-sm text-[#201b15] font-medium bg-[#f7ece2] border border-[#e0d5c1] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-[#59413b] uppercase block mb-1">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="Ex: RJ, MG, TO..."
                  value={customState}
                  onChange={(e) => setCustomState(e.target.value.toUpperCase())}
                  className="w-full h-11 px-3.5 rounded-xl text-sm text-[#201b15] font-medium bg-[#f7ece2] border border-[#e0d5c1] focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#59413b] uppercase block mb-1">
                  Cidade ou Ponto Base
                </label>
                <input
                  type="text"
                  placeholder="Ex: Vila do Abraão / Rodoviária"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl text-sm text-[#201b15] font-medium bg-[#f7ece2] border border-[#e0d5c1] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#59413b] uppercase block mb-1">
                Slogan da Dashboard (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Partiu Ilha Grande / Barcos e trilhas"
                value={customHeadline}
                onChange={(e) => setCustomHeadline(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl text-sm text-[#201b15] font-medium bg-[#f7ece2] border border-[#e0d5c1] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#59413b] uppercase block mb-1">
                Descrição dos Modais Locais
              </label>
              <input
                type="text"
                placeholder="Ex: Escunas, flexboat, táxi-boat e caminhada na mata."
                value={customSubtitle}
                onChange={(e) => setCustomSubtitle(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl text-sm text-[#201b15] font-medium bg-[#f7ece2] border border-[#e0d5c1] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full h-11 rounded-xl bg-[#c2461f] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-transform"
            >
              <PlusCircle size={16} />
              <span>Salvar e Ativar Esta Região</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
