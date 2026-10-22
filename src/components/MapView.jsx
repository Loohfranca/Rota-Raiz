import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  Layers, 
  Ship, 
  Bus, 
  Compass, 
  ArrowRight,
  Sparkles,
  Crosshair,
  Footprints,
  Clock,
  Coins,
  AlertCircle
} from 'lucide-react';
import { getStops, getPlaces, getLegs } from '../lib/supabase';
import { haversineDistance } from '../lib/router';

// Componente para ajustar o zoom do mapa quando há uma rota selecionada
function MapBoundsUpdater({ bounds, center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length > 1) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (e) {
        console.warn('Erro ao ajustar bounds do mapa:', e);
      }
    } else if (center) {
      map.setView(center, zoom || 11);
    }
  }, [bounds, center, zoom, map]);

  return null;
}

// Criação de marcadores HTML/SVG customizados e elegantes
const createStopIcon = (type) => {
  let iconSvg = '';
  // Terracota para paradas de transporte
  const bg = '#c2461f';

  if (type === 'ferry') {
    iconSvg = `<path d="M2 20a6 6 0 0 0 12 0 6 6 0 0 0 8 0" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M4 18l3-10h10l3 10" stroke="white" stroke-width="2" fill="none"/><line x1="12" y1="4" x2="12" y2="8" stroke="white" stroke-width="2"/>`;
  } else if (type === 'canoe') {
    iconSvg = `<circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="white"/>`;
  } else if (type === 'walk') {
    iconSvg = `<circle cx="12" cy="5" r="2" fill="white"/><path d="M10 22v-6l-2-2v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4l-2 2v6" stroke="white" stroke-width="2"/>`;
  } else {
    // van / onibus
    iconSvg = `<rect x="4" y="4" width="16" height="13" rx="2" stroke="white" stroke-width="2" fill="none"/><circle cx="8" cy="17" r="2" fill="white"/><circle cx="16" cy="17" r="2" fill="white"/>`;
  }

  // Marcador Quadrado com cantos arredondados (Terracota)
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="
        width: 34px;
        height: 34px;
        background-color: ${bg};
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        border: 2.5px solid #ffffff;
        cursor: pointer;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${iconSvg}
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
};

// Marcador Redondo Verde para Passeios / Praias
const createPlaceIcon = () => {
  return L.divIcon({
    className: 'custom-place-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background-color: #2f5d3a;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(47,93,58,0.45);
        border: 2.5px solid #ffffff;
        cursor: pointer;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -32],
  });
};

// Marcador Azul Pulsante para Localização do Usuário (GPS)
const createUserGpsIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="
        position: relative;
        width: 22px;
        height: 22px;
      ">
        <div style="
          position: absolute;
          width: 22px;
          height: 22px;
          background-color: #0284c7;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        "></div>
        <div style="
          position: absolute;
          width: 38px;
          height: 38px;
          top: -8px;
          left: -8px;
          background-color: rgba(2, 132, 199, 0.35);
          border-radius: 50%;
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

export default function MapView({ 
  home,
  routeLegsToDraw, 
  onSelectPinRoute 
}) {
  const [stops, setStops] = useState([]);
  const [places, setPlaces] = useState([]);
  const [legs, setLegs] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'stops' | 'places'
  const [selectedItem, setSelectedItem] = useState(null);

  // GPS do usuário
  const [userLocation, setUserLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Carrega dados autênticos
  useEffect(() => {
    async function loadData() {
      const [stopsData, placesData, legsData] = await Promise.all([
        getStops(),
        getPlaces(),
        getLegs(),
      ]);
      setStops(stopsData);
      setPlaces(placesData);
      setLegs(legsData);
    }
    loadData();
  }, []);

  // Centro do mapa: onde o usuário está; senão, o centro dos pontos cadastrados
  const defaultCenter = React.useMemo(() => {
    if (home?.lat != null && home?.lng != null) return [home.lat, home.lng];
    if (stops.length > 0) {
      const lat = stops.reduce((sum, st) => sum + st.lat, 0) / stops.length;
      const lng = stops.reduce((sum, st) => sum + st.lng, 0) / stops.length;
      return [lat, lng];
    }
    return [-14.2, -51.9]; // centro do Brasil enquanto os dados carregam
  }, [home, stops]);

  // Extrair coordenadas da rota se houver `routeLegsToDraw`
  const activeRouteCoords = React.useMemo(() => {
    if (!routeLegsToDraw || routeLegsToDraw.length === 0 || stops.length === 0) return null;
    const coords = [];
    routeLegsToDraw.forEach((leg, index) => {
      const fromStop = stops.find((s) => s.id === leg.from_stop_id);
      const toStop = stops.find((s) => s.id === leg.to_stop_id);
      if (index === 0 && fromStop) coords.push([fromStop.lat, fromStop.lng]);
      if (toStop) coords.push([toStop.lat, toStop.lng]);
    });
    return coords.length > 1 ? coords : null;
  }, [routeLegsToDraw, stops]);

  // Função para pegar posição atual do GPS do celular
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGpsError('GPS não suportado neste navegador.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        setGpsLoading(false);
        setGpsError('Não foi possível obter o sinal do GPS.');
        console.warn('GPS error:', err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Itens filtrados para exibição no mapa
  const displayedStops = filter === 'places' ? [] : stops;
  const displayedPlaces = filter === 'stops' ? [] : places;

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full pb-8">
      {/* Header */}
      <section className="flex flex-col pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#c2461f]">
            Mapa
          </span>
        </div>
        <h1 className="font-headline font-bold text-2xl sm:text-3xl text-[#201b15] tracking-tight mt-0.5">
          Mapa de Conexões & Paradas
        </h1>
        <p className="text-xs sm:text-sm text-[#59413b] mt-0.5">
          Pontos de embarque e passeios cadastrados.
        </p>
      </section>

      {/* Filter and GPS Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'Tudo', icon: Layers },
            { id: 'stops', label: 'Paradas de Transporte', icon: Bus },
            { id: 'places', label: 'Passeios & Praias', icon: MapPin },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = filter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border ${
                  isActive
                    ? 'bg-[#c2461f] text-white border-[#c2461f] shadow-xs'
                    : 'bg-[#ffffff] text-[#59413b] border-[#e0d5c1] hover:bg-[#f7ece2]'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* GPS Button */}
        <button
          onClick={handleLocateMe}
          disabled={gpsLoading}
          type="button"
          className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-[#0284c7]/10 hover:bg-[#0284c7]/20 text-[#0284c7] text-xs font-bold flex items-center gap-1.5 border border-[#0284c7]/30 transition-all active:scale-95 shrink-0"
        >
          <Crosshair size={15} className={gpsLoading ? 'animate-spin' : ''} />
          <span>{gpsLoading ? 'Obtendo GPS...' : 'Minha Localização'}</span>
        </button>
      </div>

      {gpsError && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="text-amber-600 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Active Route Notification Banner */}
      {activeRouteCoords && (
        <div className="p-3 rounded-xl bg-[#c2461f] text-white text-xs font-medium flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            <span>Itinerário traçado no mapa com {routeLegsToDraw.length} etapa(s) de transporte.</span>
          </div>
        </div>
      )}

      {/* Leaflet Map Frame */}
      <div className="w-full h-[calc(100dvh-17rem)] min-h-[340px] sm:h-[540px] rounded-3xl overflow-hidden shadow-xs border border-[#e0d5c1] relative bg-[#f7ece2]">
        <MapContainer
          center={defaultCenter}
          zoom={10}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Controlador de Bounds / Zoom */}
          <MapBoundsUpdater
            bounds={activeRouteCoords}
            center={userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter}
            zoom={userLocation ? 13 : 10}
          />

          {/* Linha da Rota Selecionada (Terracota com glow) */}
          {activeRouteCoords && (
            <Polyline
              positions={activeRouteCoords}
              pathOptions={{ 
                color: '#c2461f', 
                weight: 5, 
                opacity: 0.9,
                dashArray: '8, 8',
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          )}

          {/* Marcador GPS do Usuário */}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createUserGpsIcon()}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <strong className="text-[#0284c7]">Você está aqui</strong>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marcadores de Paradas de Transporte (Quadrados Terracota) */}
          {displayedStops.map((stop) => {
            const distance = userLocation 
              ? haversineDistance(userLocation.lat, userLocation.lng, stop.lat, stop.lng) 
              : null;

            return (
              <Marker
                key={stop.id}
                position={[stop.lat, stop.lng]}
                icon={createStopIcon(stop.type)}
                eventHandlers={{
                  click: () => setSelectedItem({ ...stop, isStop: true, distanceKm: distance }),
                }}
              >
                <Popup>
                  <div className="flex flex-col gap-1.5 p-1 max-w-[220px]">
                    <span className="text-[10px] uppercase font-bold text-[#c2461f]">
                      Parada de Transporte
                    </span>
                    <strong className="font-headline text-sm text-[#201b15] leading-tight">
                      {stop.name}
                    </strong>
                    <p className="text-xs text-[#59413b]">
                      {stop.address || stop.short_name}
                    </p>
                    {distance != null && (
                      <span className="text-[11px] font-bold text-[#2f5d3a]">
                        ~ {distance} km em linha reta de você
                      </span>
                    )}
                    <button
                      onClick={() => onSelectPinRoute && onSelectPinRoute(stop.name)}
                      className="mt-2 min-h-[36px] px-3 rounded-lg text-xs font-bold text-white bg-[#c2461f] hover:bg-[#a02e06] flex items-center justify-center gap-1 shadow-xs transition-colors"
                    >
                      <span>Traçar rota até aqui</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Marcadores de Passeios e Praias (Círculos Verdes) */}
          {displayedPlaces.map((place) => {
            const distance = userLocation 
              ? haversineDistance(userLocation.lat, userLocation.lng, place.lat, place.lng) 
              : null;

            return (
              <Marker
                key={place.id}
                position={[place.lat, place.lng]}
                icon={createPlaceIcon()}
                eventHandlers={{
                  click: () => setSelectedItem({ ...place, isPlace: true, distanceKm: distance }),
                }}
              >
                <Popup>
                  <div className="flex flex-col gap-1.5 p-1 max-w-[220px]">
                    <span className="text-[10px] uppercase font-bold text-[#2f5d3a]">
                      Atrativo / Praia
                    </span>
                    <strong className="font-headline text-sm text-[#201b15] leading-tight">
                      {place.title}
                    </strong>
                    <p className="text-xs text-[#59413b]">
                      {place.subtitle || place.location}
                    </p>
                    {place.tide_dependent && (
                      <span className="text-[11px] font-bold text-blue-700">
                        🌊 {place.tide_window || 'Melhor na maré baixa'}
                      </span>
                    )}
                    {distance != null && (
                      <span className="text-[11px] font-bold text-[#2f5d3a]">
                        ~ {distance} km de você
                      </span>
                    )}
                    <button
                      onClick={() => onSelectPinRoute && onSelectPinRoute(place.title)}
                      className="mt-2 min-h-[36px] px-3 rounded-lg text-xs font-bold text-white bg-[#2f5d3a] hover:bg-[#254b2e] flex items-center justify-center gap-1 shadow-xs transition-colors"
                    >
                      <span>Como chegar de van/balsa</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Selected Marker Detail Card */}
      {selectedItem ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#ffffff] border-2 border-[#c2461f] shadow-xs flex flex-col gap-2.5 animate-fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#c2461f]">
                {selectedItem.isPlace ? 'Passeio / Atrativo' : 'Parada de Transporte'}
              </span>
              <h3 className="font-headline font-bold text-base text-[#201b15]">
                {selectedItem.name || selectedItem.title}
              </h3>
            </div>
            <button 
              onClick={() => setSelectedItem(null)}
              className="text-xs text-[#59413b] hover:text-[#201b15] font-bold px-2 py-1"
            >
              Fechar
            </button>
          </div>

          <p className="text-xs text-[#59413b] leading-relaxed">
            {selectedItem.address || selectedItem.subtitle || selectedItem.location}
          </p>

          {selectedItem.distanceKm != null && (
            <div className="text-xs font-bold text-[#2f5d3a] flex items-center gap-1">
              <Navigation size={13} />
              <span>~ {selectedItem.distanceKm} km em linha reta da sua localização</span>
            </div>
          )}

          <button
            onClick={() => onSelectPinRoute && onSelectPinRoute(selectedItem.name || selectedItem.title)}
            type="button"
            className="min-h-[44px] w-full rounded-xl bg-[#c2461f] hover:bg-[#a02e06] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors mt-1"
          >
            <span>Planejar Trajeto até este ponto</span>
            <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-[#ffffff] border border-[#e0d5c1] flex items-center gap-3 text-xs text-[#59413b]">
          <Navigation size={18} className="text-[#c2461f] shrink-0" />
          <span>
            Toque nos <strong>quadrados terracota</strong> para paradas de vans/balsas e nos <strong>círculos verdes</strong> para praias e trilhas.
          </span>
        </div>
      )}
    </div>
  );
}
