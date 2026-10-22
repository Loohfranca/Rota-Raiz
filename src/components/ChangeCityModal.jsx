import React from 'react';
import { MapPin, Check, X } from 'lucide-react';

export default function ChangeCityModal({
  isOpen,
  onClose,
  currentRegion,
  currentLocation,
  onSelectLocation
}) {
  if (!isOpen) return null;

  const citiesList = currentRegion?.cities || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content p-5 flex flex-col gap-3.5 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-[#e0d5c1]">
          <div>
            <h2 className="font-headline font-bold text-base text-[#201b15]">
              Escolha sua Cidade ou Ponto Base
            </h2>
            <span className="text-xs text-[#59413b]">
              {currentRegion?.name || 'Região ativa'}: distâncias calculadas a partir deste local
            </span>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#201b15] hover:bg-[#f7ece2]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {citiesList.map((loc) => {
            const isSelected = currentLocation?.id === loc.id;
            return (
              <button
                key={loc.id}
                onClick={() => {
                  onSelectLocation(loc);
                  onClose();
                }}
                className={`
                  p-3.5 rounded-xl flex items-center justify-between text-left transition-all border
                  ${isSelected 
                    ? 'bg-[#ffdbd1] border-[#c2461f] shadow-xs' 
                    : 'bg-[#ffffff] border-[#e0d5c1] hover:bg-[#fdf2e7]'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0
                    ${isSelected ? 'bg-[#c2461f] text-white' : 'bg-[#f7ece2] text-[#59413b]'}
                  `}>
                    <MapPin size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-bold text-sm ${isSelected ? 'text-[#c2461f]' : 'text-[#201b15]'}`}>
                      {loc.name}
                    </span>
                    <span className="text-[11px] text-[#59413b]">
                      Ponto de conexão regional
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-xs font-bold text-[#c2461f] uppercase tracking-wide flex items-center gap-1">
                    <Check size={14} />
                    <span>Ativo</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
