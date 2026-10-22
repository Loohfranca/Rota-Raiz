import React, { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import {
  MapPin,
  Navigation,
  Bus,
  Compass,
  ArrowRight,
  Crosshair,
  X,
  Route,
  Waves,
} from "lucide-react";
import { getStops, getPlaces } from "../lib/supabase";
import { haversineDistance } from "../lib/router";
import PageHeading from "./PageHeading";
function MapPosition({ center, bounds }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (bounds?.length > 1)
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
    else map.setView(center, 13);
  }, [center, bounds, map]);
  return null;
}
// Criação de marcadores HTML/SVG customizados e elegantes
const createStopIcon = (type) => {
  let iconSvg = "";
  // Terracota para paradas de transporte
  const bg = "#c2461f";

  if (type === "ferry") {
    iconSvg = `<path d="M2 20a6 6 0 0 0 12 0 6 6 0 0 0 8 0" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M4 18l3-10h10l3 10" stroke="white" stroke-width="2" fill="none"/><line x1="12" y1="4" x2="12" y2="8" stroke="white" stroke-width="2"/>`;
  } else if (type === "canoe") {
    iconSvg = `<circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="white"/>`;
  } else if (type === "walk") {
    iconSvg = `<circle cx="12" cy="5" r="2" fill="white"/><path d="M10 22v-6l-2-2v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4l-2 2v6" stroke="white" stroke-width="2"/>`;
  } else {
    // van / onibus
    iconSvg = `<rect x="4" y="4" width="16" height="13" rx="2" stroke="white" stroke-width="2" fill="none"/><circle cx="8" cy="17" r="2" fill="white"/><circle cx="16" cy="17" r="2" fill="white"/>`;
  }

  // Marcador Quadrado com cantos arredondados (Terracota)
  return L.divIcon({
    className: "custom-stop-marker",
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
    className: "custom-place-marker",
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
    className: "custom-user-marker",
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
  destination,
  routeLegsToDraw,
  onSelectPinRoute,
  onOpenTour,
}) {
  const [stops, setStops] = useState([]),
    [places, setPlaces] = useState([]),
    [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState(
      destination ? { ...destination, isPlace: true } : null,
    ),
    [gps, setGps] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([getStops(), getPlaces()])
      .then(([s, p]) => {
        if (active) {
          setStops(s);
          setPlaces(p);
        }
      })
      .catch(() =>
        setError(
          "Não foi possível atualizar os pontos. Tente novamente com conexão.",
        ),
      );
    return () => {
      active = false;
    };
  }, []);
  const center = useMemo(
    () =>
      destination
        ? [destination.lat, destination.lng]
        : gps
          ? [gps.lat, gps.lng]
          : home?.lat != null
            ? [home.lat, home.lng]
            : [-16.492, -39.073],
    [home, destination, gps],
  );
  const bounds = useMemo(() => {
    if (!routeLegsToDraw?.length || !stops.length) return null;
    return routeLegsToDraw.flatMap((leg, i) => {
      const a = stops.find((s) => s.id === leg.from_stop_id),
        b = stops.find((s) => s.id === leg.to_stop_id);
      return [
        ...(i === 0 && a ? [[a.lat, a.lng]] : []),
        ...(b ? [[b.lat, b.lng]] : []),
      ];
    });
  }, [routeLegsToDraw, stops]);
  const locate = () => {
    if (!navigator.geolocation) {
      setError("Seu navegador não oferece localização.");
      return;
    }
    setBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setBusy(false);
      },
      () => {
        setError(
          "Localização indisponível. Você pode continuar explorando o mapa.",
        );
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };
  const distance =
    selected && gps
      ? haversineDistance(gps.lat, gps.lng, selected.lat, selected.lng)
      : null;
  const items = [
    ...(filter === "places"
      ? []
      : stops.map((s) => ({ ...s, isPlace: false }))),
    ...(filter === "stops" ? [] : places.map((p) => ({ ...p, isPlace: true }))),
  ];
  return (
    <div className="map-page">
      <PageHeading
        eyebrow="Encontre seu caminho"
        title="O lugar,"
        accent="no mapa."
        description="Praias e pontos de embarque para conectar sua viagem."
      />
      <div className="map-layout">
        <div className="map-stage">
          <div
            className="map-floating-filters"
            role="group"
            aria-label="Mostrar no mapa"
          >
            {[
              { id: "all", label: "Tudo", icon: Compass },
              { id: "places", label: "Praias", icon: Waves },
              { id: "stops", label: "Embarques", icon: Bus },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          <button
            className="map-locate icon-button"
            onClick={locate}
            disabled={busy}
            aria-label="Minha localização no mapa"
          >
            <Crosshair size={21} className={busy ? "animate-spin" : ""} />
          </button>
          <MapContainer center={center} zoom={12} zoomControl={false}>
            <TileLayer
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="topright" />
            <MapPosition center={center} bounds={bounds} />
            {bounds?.length > 1 && (
              <Polyline
                positions={bounds}
                pathOptions={{ color: "#a64425", weight: 4, dashArray: "8 8" }}
              />
            )}
            {gps && (
              <Marker position={[gps.lat, gps.lng]} icon={createUserGpsIcon()}>
                <Popup>Você está aqui</Popup>
              </Marker>
            )}
            {items
              .filter(
                (i) =>
                  Number.isFinite(Number(i.lat)) &&
                  Number.isFinite(Number(i.lng)),
              )
              .map((i) => (
                <Marker
                  key={`${i.isPlace ? "place" : "stop"}-${i.id}`}
                  position={[i.lat, i.lng]}
                  icon={i.isPlace ? createPlaceIcon() : createStopIcon(i.type)}
                  eventHandlers={{ click: () => setSelected(i) }}
                >
                  <Popup>
                    <strong>{i.title || i.name}</strong>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
          <div className="map-legend">
            <span>
              <i />
              Praias
            </span>
            <span>
              <i />
              Embarques
            </span>
          </div>
        </div>
        <aside className="map-info-panel">
          {selected ? (
            <>
              <div className="map-panel-heading">
                <span className="note-icon">
                  {selected.isPlace ? <Waves size={23} /> : <Bus size={23} />}
                </span>
                <button
                  className="icon-button"
                  aria-label="Fechar lugar selecionado"
                  onClick={() => setSelected(null)}
                >
                  <X size={18} />
                </button>
              </div>
              <p className="eyebrow">
                {selected.isPlace ? "Seu próximo destino" : "Ponto de embarque"}
              </p>
              <h2>{selected.title || selected.name}</h2>
              <p>
                {selected.subtitle ||
                  selected.address ||
                  selected.location ||
                  selected.short_name}
              </p>
              {distance != null && (
                <p className="map-distance">
                  <Navigation size={16} />
                  {Number(distance).toLocaleString("pt-BR", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  km em linha reta de você
                </p>
              )}
              {selected.isPlace && (
                <button
                  className="button button-primary"
                  onClick={() => onOpenTour(selected)}
                >
                  Conhecer e ver acessos <ArrowRight size={18} />
                </button>
              )}
              <button
                className={`button ${selected.isPlace ? "button-secondary" : "button-primary"}`}
                onClick={() =>
                  onSelectPinRoute(selected.title || selected.name)
                }
              >
                Consultar transportes <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <>
              <span className="note-icon">
                <MapPin size={26} />
              </span>
              <p className="eyebrow">Explore sem pressa</p>
              <h2>
                Uma parada.
                <br />
                Novas descobertas.
              </h2>
              <p>
                Toque em uma praia ou ponto de embarque para conhecer o lugar e
                planejar como chegar.
              </p>
              <div className="map-panel-origin">
                <Navigation size={19} />
                <span>
                  <small>Seu ponto de partida</small>
                  <strong>
                    {home?.name || "Escolha sua origem em Explorar"}
                  </strong>
                </span>
              </div>
            </>
          )}
          {bounds?.length > 1 && (
            <div className="inline-notice">
              <Route size={18} />
              <p>
                Ligação entre os pontos de embarque. A linha não representa o
                percurso exato pelas vias.
              </p>
            </div>
          )}
          {error && (
            <p role="status" className="inline-notice">
              {error}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
