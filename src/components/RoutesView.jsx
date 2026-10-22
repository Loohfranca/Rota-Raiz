import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  ArrowUpDown, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Lightbulb, 
  Sliders, 
  Route, 
  Bus, 
  Ship,
  Compass,
  Coins, 
  Navigation, 
  Sparkles,
  HelpCircle,
  PlusCircle,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { getStops, getLegs, getPlaces, getCities } from '../lib/supabase';
import { searchLocations, calculateRoute, findClosestStop } from '../lib/router';

export default function RoutesView({
  currentRegion,
  currentLocation,
  initialDestination,
  onOpenChangeCity,
  onOpenRegionModal,
  onSelectRoute,
  onNavigateToAdmin
}) {
  const [stops, setStops] = useState([]);
  const [legs, setLegs] = useState([]);
  const [places, setPlaces] = useState([]);
  const [cities, setCities] = useState([]);

  const [originText, setOriginText] = useState(currentLocation?.name || 'Porto Seguro');
  const [destText, setDestText] = useState(initialDestination || '');

  // Sincroniza destino inicial quando enviado de outra tela (Passeios ou Mapa)
  useEffect(() => {
    if (initialDestination) {
      setDestText(initialDestination);
    }
  }, [initialDestination]);
  
  // Autocomplete states
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  // GPS state
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Calculation state
  const [calculatedResult, setCalculatedResult] = useState(null);
  const [activeOptionMode, setActiveOptionMode] = useState('fastest'); // 'fastest' | 'cheapest'

  const originRef = useRef(null);
  const destRef = useRef(null);

  // Carrega nós e arestas do grafo
  useEffect(() => {
    async function loadGraph() {
      const [stopsData, legsData, placesData, citiesData] = await Promise.all([
        getStops(),
        getLegs(),
        getPlaces(),
        getCities(),
      ]);
      setStops(stopsData);
      setLegs(legsData);
      setPlaces(placesData);
      setCities(citiesData);
    }
    loadGraph();
  }, []);

  // Sincroniza quando a cidade/região muda
  useEffect(() => {
    if (currentLocation?.name) {
      setOriginText(currentLocation.name);
    }
  }, [currentLocation]);

  // Fecha dropdowns se clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (originRef.current && !originRef.current.contains(e.target)) {
        setShowOriginDropdown(false);
      }
      if (destRef.current && !destRef.current.contains(e.target)) {
        setShowDestDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOriginChange = (val) => {
    setOriginText(val);
    const suggestions = searchLocations(val, stops, places, cities);
    setOriginSuggestions(suggestions);
    setShowOriginDropdown(true);
  };

  const handleDestChange = (val) => {
    setDestText(val);
    const suggestions = searchLocations(val, stops, places, cities);
    setDestSuggestions(suggestions);
    setShowDestDropdown(true);
  };

  const handleSwap = () => {
    const temp = originText;
    setOriginText(destText || 'Porto Seguro');
    setDestText(temp);
    setCalculatedResult(null);
  };

  // Botão: Usar minha localização atual (GPS)
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const closest = findClosestStop(latitude, longitude, stops);
        if (closest) {
          setOriginText(closest.name);
          setShowOriginDropdown(false);
        } else {
          setLocationError('Nenhuma parada de transporte encontrada próxima de você.');
        }
      },
      (err) => {
        setIsLocating(false);
        setLocationError('Não foi possível obter sua localização (GPS desativado ou permissão negada).');
        console.warn('Erro GPS:', err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Executa o cálculo da rota via Dijkstra
  const handleCalculateRoute = (e) => {
    e?.preventDefault();
    setShowOriginDropdown(false);
    setShowDestDropdown(false);

    const destination = destText.trim() ? destText : 'Caraíva';
    const result = calculateRoute(originText, destination, stops, legs);
    setCalculatedResult(result);
    setActiveOptionMode('fastest');
  };

  const handleSelectQuickDest = (destTitle) => {
    setDestText(destTitle);
    const result = calculateRoute(originText, destTitle, stops, legs);
    setCalculatedResult(result);
    setActiveOptionMode('fastest');
  };

  const handleOpenDetailedRoute = () => {
    if (!calculatedResult || !calculatedResult.found) return;
    const selectedOption = activeOptionMode === 'cheapest' && calculatedResult.alternativeRoute
      ? calculatedResult.alternativeRoute
      : calculatedResult.primaryRoute;

    const fullRouteObject = {
      ...calculatedResult,
      selectedOption,
      legs: selectedOption.legs,
      steps: selectedOption.steps,
      totalTime: selectedOption.totalTime,
      totalCost: selectedOption.totalCostFormatted,
      polylineCoords: selectedOption.polylineCoords,
    };

    onSelectRoute(fullRouteObject);
  };

  const currentOption = calculatedResult?.found
    ? (activeOptionMode === 'cheapest' && calculatedResult.alternativeRoute
        ? calculatedResult.alternativeRoute
        : calculatedResult.primaryRoute)
    : null;

  const getTransportIcon = (mode) => {
    if (mode === 'ferry') return <Ship size={16} className="text-[#0284c7]" />;
    if (mode === 'canoe') return <Compass size={16} className="text-[#2f5d3a]" />;
    if (mode === 'bus') return <Bus size={16} className="text-[#ea580c]" />;
    return <Bus size={16} className="text-[#c2461f]" />;
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
      {/* Universal Dashboard Banner & Region Indicator */}
      <section className="p-5 rounded-3xl bg-gradient-to-br from-[#c2461f] to-[#a02e06] text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#bbefc1]" />
                <span>Litoral Sul da Bahia</span>
              </span>
              <span className="text-white/80 text-xs font-medium flex items-center gap-1">
                <Clock size={13} />
                <span>Horários de Campo</span>
              </span>
            </div>

            <button
              onClick={onOpenRegionModal}
              className="h-8 px-3 rounded-full bg-white text-[#c2461f] hover:bg-white/90 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <Sliders size={13} />
              <span>Trocar Região</span>
            </button>
          </div>

          <div>
            <h1 className="font-headline font-bold text-2xl sm:text-3xl tracking-tight leading-tight">
              {currentRegion?.headline || 'Transporte Raiz & Trilhas'}
            </h1>
            <p className="text-sm sm:text-base text-white/90 mt-1 font-medium leading-relaxed">
              {currentRegion?.subtitle || 'Vans, balsas, ônibus da Águia Azul e canoas tradicionais sem intermediários.'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20">
            <div className="flex flex-col">
              <span className="text-[11px] text-white/70 uppercase font-bold">Paradas Mapeadas</span>
              <span className="font-headline font-bold text-lg text-white">
                {stops.length || 11} nós no grafo
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-white/70 uppercase font-bold">Modais</span>
              <span className="font-headline font-bold text-lg text-white">
                Balsa, Van, Bus, Canoa
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-white/70 uppercase font-bold">Custo Típico</span>
              <span className="font-headline font-bold text-lg text-white">
                R$ 5,50 - R$ 38
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Location Picker Strip with GPS action */}
      <section className="p-3.5 sm:p-4 rounded-2xl bg-[#ffffff] border border-[#e0d5c1] flex items-center justify-between shadow-xs gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#ffdbd1] text-[#c2461f] flex items-center justify-center shrink-0 shadow-xs">
            <MapPin size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#59413b]">
              Ponto de Partida Atual:
            </span>
            <span className="font-headline font-bold text-sm sm:text-base text-[#201b15] truncate">
              {originText || currentLocation?.name || 'Porto Seguro'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            type="button"
            className="min-h-[44px] px-3 sm:px-4 rounded-xl bg-[#2f5d3a]/10 hover:bg-[#2f5d3a]/20 text-[#2f5d3a] text-xs font-bold flex items-center gap-1.5 border border-[#2f5d3a]/30 transition-all active:scale-95"
            title="Usar minha localização GPS para encontrar a parada mais próxima"
          >
            <Navigation size={16} className={isLocating ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{isLocating ? 'Localizando...' : 'Meu GPS'}</span>
          </button>

          <button
            onClick={onOpenChangeCity}
            type="button"
            className="min-h-[44px] px-3 sm:px-4 rounded-xl bg-[#f7ece2] hover:bg-[#ece1d7] text-[#201b15] text-xs font-bold flex items-center gap-1.5 border border-[#e0d5c1] transition-all active:scale-95"
          >
            <span>Trocar Base</span>
          </button>
        </div>
      </section>

      {locationError && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-600 shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Route Search Planner Card with Autocomplete */}
      <section className="p-4 sm:p-5 rounded-2xl bg-[#ffffff] border border-[#e0d5c1] shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Route size={18} className="text-[#c2461f]" />
            <span className="font-headline font-bold text-base text-[#201b15]">
              Planejar Trajeto Inteligente
            </span>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#bbefc1] text-[#00210b]">
            Grafo Multimodal Autêntico
          </span>
        </div>

        {/* Inputs Group with Quick Swap Handle */}
        <div className="relative flex flex-col gap-2.5">
          {/* Origin Input & Autocomplete */}
          <div ref={originRef} className="relative">
            <div className="flex items-center gap-3 bg-[#fdf2e7] rounded-xl px-3.5 h-12 border border-[#e0d5c1] focus-within:ring-2 focus-within:ring-[#c2461f]">
              <div className="w-3 h-3 rounded-full bg-[#c2461f] shrink-0 ring-4 ring-[#ffdbd1]" />
              <div className="flex flex-col flex-1 min-w-0">
                <label className="text-[10px] font-bold text-[#59413b] uppercase leading-none">
                  Origem (Onde você está)
                </label>
                <input
                  type="text"
                  value={originText}
                  onChange={(e) => handleOriginChange(e.target.value)}
                  onFocus={() => {
                    setOriginSuggestions(searchLocations(originText, stops, places, cities));
                    setShowOriginDropdown(true);
                  }}
                  placeholder="Ex: Porto Seguro, Balsa, Trancoso..."
                  className="text-sm font-medium text-[#201b15] bg-transparent focus:outline-none w-full truncate"
                />
              </div>
            </div>

            {/* Origin Dropdown Suggestions */}
            {showOriginDropdown && originSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e0d5c1] rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto">
                {originSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setOriginText(item.name);
                      setShowOriginDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-[#f7ece2] flex items-center justify-between border-b border-[#f7ece2] last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin size={14} className="text-[#c2461f] shrink-0" />
                      <span className="text-xs font-bold text-[#201b15] truncate">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-[#59413b] font-medium shrink-0 ml-2">
                      {item.subtitle || item.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Swap Button */}
          <button
            onClick={handleSwap}
            type="button"
            aria-label="Inverter origem e destino"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-[#f7ece2] hover:bg-[#ece1d7] text-[#201b15] flex items-center justify-center shadow-xs border border-[#e0d5c1] active:rotate-180 transition-transform"
          >
            <ArrowUpDown size={18} />
          </button>

          {/* Destination Input & Autocomplete */}
          <div ref={destRef} className="relative">
            <div className="flex items-center gap-3 bg-[#fdf2e7] rounded-xl px-3.5 h-12 border border-[#e0d5c1] focus-within:ring-2 focus-within:ring-[#2f5d3a]">
              <div className="w-3 h-3 rounded-full bg-[#2f5d3a] shrink-0 ring-4 ring-[#bbefc1]" />
              <div className="flex flex-col flex-1 min-w-0">
                <label className="text-[10px] font-bold text-[#59413b] uppercase leading-none">
                  Destino (Para onde você vai)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Caraíva, Praia do Espelho, Trancoso, Corumbau..."
                  value={destText}
                  onChange={(e) => handleDestChange(e.target.value)}
                  onFocus={() => {
                    setDestSuggestions(searchLocations(destText, stops, places, cities));
                    setShowDestDropdown(true);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCalculateRoute()}
                  className="text-sm font-medium text-[#201b15] bg-transparent focus:outline-none w-full placeholder:text-[#59413b]/60"
                />
              </div>
            </div>

            {/* Dest Dropdown Suggestions */}
            {showDestDropdown && destSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e0d5c1] rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto">
                {destSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setDestText(item.name);
                      setShowDestDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-[#f7ece2] flex items-center justify-between border-b border-[#f7ece2] last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin size={14} className="text-[#2f5d3a] shrink-0" />
                      <span className="text-xs font-bold text-[#201b15] truncate">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-[#59413b] font-medium shrink-0 ml-2">
                      {item.subtitle || item.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleCalculateRoute}
          type="button"
          className="w-full min-h-[48px] rounded-xl bg-[#c2461f] hover:bg-[#a02e06] text-white flex items-center justify-center gap-2 font-bold text-sm shadow-xs transition-all active:scale-[0.99]"
        >
          <span>Calcular Itinerário Raiz (Dijkstra)</span>
          <ArrowRight size={18} />
        </button>
      </section>

      {/* Route Calculation Result Box */}
      {calculatedResult && (
        <section className="animate-fade-in flex flex-col gap-3">
          {calculatedResult.found ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#ffffff] border-2 border-[#c2461f] shadow-md flex flex-col gap-4">
              {/* Top Route Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f7ece2] pb-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-headline font-bold text-lg text-[#201b15]">
                      {calculatedResult.originName}
                    </span>
                    <ArrowRight size={18} className="text-[#c2461f]" />
                    <span className="font-headline font-bold text-lg text-[#c2461f]">
                      {calculatedResult.destName}
                    </span>
                  </div>
                  <span className="text-xs text-[#59413b]">
                    {currentOption.stepsCount} trecho(s) de transporte regional
                  </span>
                </div>

                {/* Option Toggles if an alternative exists */}
                {calculatedResult.alternativeRoute && (
                  <div className="flex items-center gap-1 bg-[#f7ece2] p-1 rounded-xl self-start sm:self-auto">
                    <button
                      onClick={() => setActiveOptionMode('fastest')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeOptionMode === 'fastest'
                          ? 'bg-[#c2461f] text-white shadow-xs'
                          : 'text-[#59413b] hover:text-[#201b15]'
                      }`}
                    >
                      Mais rápida ({calculatedResult.primaryRoute.totalTime})
                    </button>
                    <button
                      onClick={() => setActiveOptionMode('cheapest')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeOptionMode === 'cheapest'
                          ? 'bg-[#2f5d3a] text-white shadow-xs'
                          : 'text-[#59413b] hover:text-[#201b15]'
                      }`}
                    >
                      Mais econômica ({calculatedResult.alternativeRoute.totalCostFormatted})
                    </button>
                  </div>
                )}
              </div>

              {/* Status & Alerts Bar */}
              <div className="flex items-center gap-2 flex-wrap">
                {currentOption.hasUnconfirmed ? (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1.5 border border-amber-300">
                    <ShieldAlert size={14} className="text-amber-600" />
                    <span>Não confirmado hoje por viajante</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-[#bbefc1] text-[#00210b] text-xs font-bold flex items-center gap-1.5 border border-[#2f5d3a]/30">
                    <ShieldCheck size={14} className="text-[#2f5d3a]" />
                    <span>Confirmado hoje</span>
                  </span>
                )}

                {currentOption.hasTideDependent && (
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1.5">
                    <span>🌊 Depende da maré baixa</span>
                  </span>
                )}

                <div className="ml-auto flex items-center gap-3 text-xs font-bold">
                  <span className="text-[#c2461f] flex items-center gap-1">
                    <Clock size={14} />
                    {currentOption.totalTime}
                  </span>
                  <span className="text-[#2f5d3a] flex items-center gap-1">
                    <Coins size={14} />
                    {currentOption.totalCostFormatted}
                  </span>
                </div>
              </div>

              {/* Multi-modal Steps Timeline Preview */}
              <div className="flex flex-col gap-2.5 pt-1">
                {currentOption.steps.map((step) => (
                  <div
                    key={step.number}
                    className="p-3 rounded-xl bg-[#fdf2e7] border border-[#e0d5c1] flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#c2461f] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {step.number}
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-headline font-bold text-sm text-[#201b15]">
                          {getTransportIcon(step.mode)}
                          <span>{step.title}</span>
                        </div>
                        <span className="text-xs font-bold text-[#201b15] shrink-0">
                          {step.priceFormatted}
                        </span>
                      </div>

                      <div className="text-xs text-[#59413b] mt-1 flex flex-col gap-0.5">
                        <span className="truncate">
                          <strong>Embarque:</strong> {step.pickupName}
                        </span>
                        <span className="truncate">
                          <strong>Desembarque:</strong> {step.dropoffName}
                        </span>
                      </div>

                      {step.notes && (
                        <p className="text-[11px] text-[#8a5b28] bg-amber-50/80 p-1.5 rounded-lg border border-amber-200/60 mt-1.5 leading-relaxed">
                          💡 {step.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button: Open Full Details & Map */}
              <button
                onClick={handleOpenDetailedRoute}
                type="button"
                className="w-full min-h-[46px] rounded-xl bg-[#c2461f] hover:bg-[#a02e06] text-white flex items-center justify-center gap-2 font-bold text-xs sm:text-sm shadow-xs transition-colors"
              >
                <span>Ver Rota Detalhada Completa & Mapa</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            /* Fallback Realista: Rota Inexistente no Grafo */
            <div className="p-5 rounded-2xl bg-[#ffffff] border border-amber-300 shadow-xs flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle size={20} className="shrink-0" />
                <h3 className="font-headline font-bold text-base">
                  Ainda não temos essa rota cadastrada
                </h3>
              </div>
              <p className="text-xs text-[#59413b] leading-relaxed">
                {calculatedResult.message || 'Não há conexão de transporte regional conhecida cadastrada para este trecho.'}
              </p>
              <p className="text-xs text-[#59413b]">
                No Rota Raiz não inventamos rotas fictícias. Você pode cadastrar ou sugerir novos trechos reais no painel de viajantes.
              </p>
              {onNavigateToAdmin && (
                <button
                  onClick={onNavigateToAdmin}
                  type="button"
                  className="min-h-[44px] px-4 rounded-xl bg-[#f7ece2] hover:bg-[#ece1d7] text-[#c2461f] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#e0d5c1] self-start"
                >
                  <PlusCircle size={16} />
                  <span>Cadastrar este trecho no Painel</span>
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* Frequent Destinations Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Bus size={18} className="text-[#c2461f]" />
            <h2 className="font-headline font-bold text-base text-[#201b15]">
              Destinos Mais Buscados no Litoral Sul
            </h2>
          </div>
          <span className="text-xs text-[#59413b] font-medium">
            Toque para calcular agora
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              id: 'quick-caraiva',
              name: 'Caraíva',
              modalSubtitle: 'Balsa + Ônibus Águia Azul + Canoa Pataxó',
              duration: '~ 3h 10 min',
              price: 'R$ 38,00',
              badge: 'Último ônibus 15:45',
            },
            {
              id: 'quick-espelho',
              name: 'Praia do Espelho',
              modalSubtitle: 'Balsa + Van Direta Linha Curuípe',
              duration: '~ 1h 40 min',
              price: 'R$ 30,50',
              badge: 'Volta às 16:20',
            },
            {
              id: 'quick-trancoso',
              name: 'Trancoso',
              modalSubtitle: 'Balsa + Van Cooperativa dos Coqueiros',
              duration: '~ 1h 15 min',
              price: 'R$ 20,50',
              badge: 'Vans até 23h',
            },
            {
              id: 'quick-corumbau',
              name: 'Ponta do Corumbau',
              modalSubtitle: 'Ônibus até Caraíva + Barco Rústico/Buggy',
              duration: '~ 3h 45 min',
              price: 'R$ 83,00',
              badge: 'Depende de maré baixa',
            },
          ].map((dest) => (
            <div
              key={dest.id}
              onClick={() => handleSelectQuickDest(dest.name)}
              role="button"
              tabIndex={0}
              className="p-4 rounded-2xl bg-[#ffffff] border border-[#e0d5c1] hover:border-[#c2461f] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="font-headline font-bold text-base text-[#201b15] truncate">
                    {dest.name}
                  </span>
                  <span className="text-xs text-[#59413b] mt-0.5 line-clamp-1">
                    {dest.modalSubtitle}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#f7ece2] flex items-center justify-center text-[#201b15] shrink-0">
                  <ArrowRight size={16} />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#f7ece2]">
                <span className="px-2.5 py-0.5 rounded-full bg-[#ffdf9b] text-[#251a00] text-xs font-bold flex items-center gap-1">
                  <Clock size={12} />
                  <span>{dest.duration}</span>
                </span>

                <span className="px-2.5 py-0.5 rounded-full bg-[#ece1d7] text-[#201b15] text-xs font-bold">
                  {dest.price}
                </span>

                <span className="text-xs font-bold text-[#2f5d3a] ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2f5d3a]" />
                  {dest.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Context Tip Card */}
      <section className="p-4 rounded-2xl bg-[#bbefc1]/30 border border-[#e0d5c1] flex items-start gap-3.5 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-[#2f5d3a] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Lightbulb size={20} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-headline font-bold text-sm text-[#201b15]">
            Dica do Mochileiro Raiz no Sul da Bahia
          </span>
          <p className="text-xs text-[#59413b] mt-1 leading-relaxed">
            Em Caraíva e na Praia do Espelho, as máquinas de cartão costumam falhar por instabilidade no sinal 4G. Tenha sempre notas trocadas (R$ 5, 10 e 20) para pagar balsa, canoa e vans na hora do embarque.
          </p>
        </div>
      </section>
    </div>
  );
}
