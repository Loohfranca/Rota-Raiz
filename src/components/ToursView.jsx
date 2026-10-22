import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  CheckCircle2, 
  Download, 
  ChevronRight, 
  Clock, 
  Coins, 
  Star, 
  Lightbulb, 
  Check, 
  Cloud,
  Navigation,
  ArrowRight
} from 'lucide-react';
import { getPlaces } from '../lib/supabase';
import { toggleSaveTourOffline, getOfflineStorage } from '../lib/supabase';
import { haversineDistance } from '../lib/router';

export default function ToursView({
  currentLocation,
  onOpenChangeCity,
  onSelectTour
}) {
  const [places, setPlaces] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const { tours: savedTours } = getOfflineStorage();
  const [offlineSavedList, setOfflineSavedList] = useState(savedTours);

  const categories = ['Todos', 'Praias', 'Trilhas & Rios', 'Histórico'];

  useEffect(() => {
    async function loadPlacesData() {
      const data = await getPlaces();
      setPlaces(data);
    }
    loadPlacesData();
  }, []);

  const filteredPlaces = places.filter((place) => {
    const titleMatch = (place.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const locMatch = (place.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const catMatch = selectedCategory === 'Todos' || place.category === selectedCategory;
    return (titleMatch || locMatch) && catMatch;
  });

  const handleToggleOffline = (e, tourId) => {
    e.stopPropagation();
    const isNowSaved = toggleSaveTourOffline(tourId);
    if (isNowSaved) {
      setOfflineSavedList([...offlineSavedList, tourId]);
    } else {
      setOfflineSavedList(offlineSavedList.filter((id) => id !== tourId));
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full pb-8">
      {/* Header */}
      <section className="flex flex-col pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#c2461f]">
            Destinos Autênticos
          </span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#bbefc1] text-[#00210b]">
            {offlineSavedList.length} Salvos Offline
          </span>
        </div>
        <h1 className="font-headline font-bold text-2xl sm:text-3xl text-[#201b15] tracking-tight mt-0.5">
          Passeios & Atrativos Naturais
        </h1>
        <p className="text-xs sm:text-sm text-[#59413b] mt-0.5">
          Distâncias reais, horários de tábua de marés e transporte raiz sem intermediários.
        </p>
      </section>

      {/* Base Location Reference Strip */}
      <section className="p-3.5 rounded-2xl bg-[#ffffff] border border-[#e0d5c1] shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#f7ece2] text-[#c2461f] flex items-center justify-center shrink-0 border border-[#e0d5c1]">
            <MapPin size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#59413b]">
              Ponto de Partida Base:
            </span>
            <span className="font-headline font-bold text-sm text-[#201b15] truncate">
              {currentLocation?.name || 'Porto Seguro'}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenChangeCity}
          type="button"
          className="min-h-[44px] px-3.5 rounded-xl text-xs font-bold bg-[#f7ece2] hover:bg-[#ece1d7] text-[#c2461f] border border-[#e0d5c1] transition-colors shrink-0"
        >
          Mudar Base
        </button>
      </section>

      {/* Search and Category Filters */}
      <section className="flex flex-col gap-3">
        <div className="relative w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#59413b] pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar praia, falésia, reserva ou aldeia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl text-sm text-[#201b15] placeholder:text-[#59413b]/60 bg-[#ffffff] border border-[#e0d5c1] focus:outline-none shadow-xs font-medium"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-[#c2461f] text-white border-[#c2461f] shadow-xs'
                    : 'bg-[#ffffff] text-[#59413b] border-[#e0d5c1] hover:bg-[#f7ece2]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* Places Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPlaces.map((place) => {
          const isSaved = offlineSavedList.includes(place.id);
          const distance = currentLocation?.lat && currentLocation?.lng
            ? haversineDistance(currentLocation.lat, currentLocation.lng, place.lat, place.lng)
            : null;

          return (
            <article
              key={place.id}
              onClick={() => onSelectTour(place)}
              role="button"
              tabIndex={0}
              className="rounded-2xl bg-[#ffffff] border border-[#e0d5c1] hover:border-[#c2461f] hover:shadow-xs transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              {/* Photo Banner */}
              <div className="relative h-48 w-full bg-[#f7ece2] overflow-hidden">
                <img
                  src={place.image_url}
                  alt={place.photo_alt || place.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />

                {/* Salvo Offline Pill */}
                <div className={`
                  absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs backdrop-blur-md
                  ${isSaved ? 'bg-white/95 text-[#2f5d3a]' : 'bg-black/60 text-white'}
                `}>
                  {isSaved ? <Check size={13} /> : <Cloud size={13} />}
                  <span className="text-[11px]">{isSaved ? 'Salvo no Dispositivo' : 'Offline Pronto'}</span>
                </div>

                {/* Location Pin */}
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-black/60 backdrop-blur-md flex items-center gap-1">
                  <MapPin size={13} />
                  <span>{place.location.split(',')[0]}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-headline font-bold text-base sm:text-lg text-[#201b15]">
                      {place.title}
                    </h2>
                    <p className="text-xs text-[#59413b] mt-0.5">
                      {place.location}
                    </p>
                  </div>
                  {distance != null && (
                    <span className="font-headline font-bold text-sm text-[#c2461f] shrink-0">
                      ~ {distance} km
                    </span>
                  )}
                </div>

                {/* Tide or Access Alert Pill */}
                {place.tide_dependent ? (
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-medium text-blue-900 flex items-center gap-2">
                    <span>🌊</span>
                    <span className="truncate">{place.tide_window || 'Melhor na maré baixa'}</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#fdf2e7] border border-[#e0d5c1] text-xs font-medium text-[#201b15] flex items-center gap-2">
                    <Clock size={14} className="text-[#c2461f] shrink-0" />
                    <span className="truncate">{place.expense_range || 'Acesso livre e gratuito'}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-between border-t border-[#f7ece2]">
                  <button
                    onClick={(e) => handleToggleOffline(e, place.id)}
                    type="button"
                    className={`min-h-[44px] px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all border ${
                      isSaved 
                        ? 'bg-[#bbefc1] text-[#00210b] border-[#bbefc1]' 
                        : 'bg-[#2f5d3a] text-white border-[#2f5d3a]'
                    }`}
                  >
                    {isSaved ? <Check size={14} /> : <Download size={14} />}
                    <span>{isSaved ? 'Salvo' : 'Salvar Offline'}</span>
                  </button>

                  <button
                    onClick={() => onSelectTour(place)}
                    type="button"
                    className="min-h-[44px] px-3.5 rounded-xl bg-[#f7ece2] hover:bg-[#ece1d7] text-[#c2461f] border border-[#e0d5c1] flex items-center gap-1 text-xs font-bold transition-colors"
                  >
                    <span>Ver Detalhes</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Helpful Traveler Note */}
      <section className="p-4 rounded-2xl bg-[#bbefc1]/30 border border-[#e0d5c1] flex items-start gap-3 shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-[#2f5d3a] text-white flex items-center justify-center shrink-0">
          <Lightbulb size={20} />
        </div>
        <div className="flex flex-col">
          <span className="font-headline font-bold text-sm text-[#201b15]">
            Dica do Mochileiro Raiz no Sul da Bahia
          </span>
          <p className="text-xs text-[#59413b] mt-0.5 leading-relaxed">
            Para passeios como Praia do Espelho e Corumbau, consulte a tábua de marés da Marinha antes de sair. As piscinas e a ponta de areia só aparecem na maré baixa (abaixo de 0.4 metros).
          </p>
        </div>
      </section>
    </div>
  );
}
