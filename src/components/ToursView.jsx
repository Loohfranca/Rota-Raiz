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
import { getPlaces, getStops, getCities } from '../lib/supabase';
import PlaceInput from './PlaceInput';
import { toggleSaveTourOffline, getOfflineStorage } from '../lib/supabase';
import { haversineDistance } from '../lib/router';

export default function ToursView({
  home,
  onChangeHome,
  onSelectTour
}) {
  const [places, setPlaces] = useState([]);
  const [stops, setStops] = useState([]);
  const [cities, setCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const { tours: savedTours } = getOfflineStorage();
  const [offlineSavedList, setOfflineSavedList] = useState(savedTours);

  const categories = ['Todos', 'Praias', 'Trilhas & Rios', 'Histórico'];

  useEffect(() => {
    async function loadPlacesData() {
      const [data, stopsData, citiesData] = await Promise.all([getPlaces(), getStops(), getCities()]);
      setPlaces(data);
      setStops(stopsData);
      setCities(citiesData);
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
          Praias e atrativos com a distância a partir de onde você está.
        </p>
      </section>

      {/* Base das distâncias: o usuário escolhe de onde mede */}
      <section className="flex flex-col gap-1.5">
        <PlaceInput
          label="Distâncias a partir de"
          value={home}
          onChange={onChangeHome}
          placeholder="Onde você está hospedado?"
          stops={stops}
          places={places}
          cities={cities}
          accent="#2f5d3a"
        />
        {!(home?.lat != null && home?.lng != null) && (
          <p className="text-xs text-[#59413b] px-1">
            Escolha um lugar da lista para ver os km até cada passeio.
          </p>
        )}
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
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlaces.map((place) => {
          const isSaved = offlineSavedList.includes(place.id);
          const distance = home?.lat != null && home?.lng != null
            ? haversineDistance(home.lat, home.lng, place.lat, place.lng)
            : null;

          return (
            <article
              key={place.id}
              onClick={() => onSelectTour(place)}
              role="button"
              tabIndex={0}
              className="group rounded-2xl bg-[#ffffff] border border-[#e0d5c1] hover:border-[#c2461f] hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
            >
              {/* Photo Banner with Overlay */}
              <div className="relative h-40 sm:h-44 w-full bg-[#f7ece2] overflow-hidden">
                <img
                  src={place.image_url}
                  alt={place.photo_alt || place.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Gradient Overlay for Better Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Top Right: Offline Status */}
                <div className="absolute top-2 right-2">
                  <button
                    onClick={(e) => handleToggleOffline(e, place.id)}
                    type="button"
                    className={`
                      flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm transition-all
                      ${isSaved
                        ? 'bg-[#2f5d3a] text-white'
                        : 'bg-white/90 text-[#59413b] hover:bg-white'
                      }
                    `}
                    aria-label={isSaved ? 'Remover offline' : 'Salvar offline'}
                  >
                    {isSaved ? <Check size={12} /> : <Download size={12} />}
                    <span className="text-[10px]">{isSaved ? 'Salvo' : 'Salvar'}</span>
                  </button>
                </div>

                {/* Bottom Left: Location */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white">
                  <MapPin size={12} className="shrink-0" />
                  <span>{place.location.split(',')[0]}</span>
                </div>

                {/* Bottom Right: Distance (if available) */}
                {distance != null && (
                  <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-[#c2461f] text-white text-xs font-bold">
                    ~ {distance} km
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3 sm:p-4 flex flex-col gap-2.5 flex-1">
                {/* Title & Category */}
                <div className="flex flex-col gap-1">
                  <h2 className="font-headline font-bold text-base sm:text-lg text-[#201b15] leading-tight">
                    {place.title}
                  </h2>
                  <p className="text-xs text-[#59413b]">
                    {place.location}
                  </p>
                </div>

                {/* Info Chip: Tide or Cost */}
                <div className={`
                  text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5
                  ${place.tide_dependent
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'bg-[#fdf2e7] text-[#201b15] border border-[#e0d5c1]'
                  }
                `}>
                  {place.tide_dependent ? (
                    <>
                      <span>🌊</span>
                      <span>{place.tide_window || 'Maré baixa'}</span>
                    </>
                  ) : (
                    <>
                      <Clock size={13} className="text-[#c2461f] shrink-0" />
                      <span>{place.expense_range || 'Acesso gratuito'}</span>
                    </>
                  )}
                </div>

                {/* Spacer for button alignment */}
                <div className="flex-1" />

                {/* Main Action Button */}
                <button
                  onClick={() => onSelectTour(place)}
                  type="button"
                  className="w-full min-h-[40px] rounded-xl bg-[#c2461f] hover:bg-[#a02e06] text-white flex items-center justify-center gap-2 text-xs font-bold transition-colors shadow-xs"
                >
                  <span>Ver Detalhes</span>
                  <ArrowRight size={13} />
                </button>
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
