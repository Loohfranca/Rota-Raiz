import React, { useState, useEffect, useId, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import {
  MapPin,
  Search,
  Crosshair,
  Map,
  ChevronDown,
  ArrowRight,
  Check,
  X,
  LoaderCircle,
} from "lucide-react";
import L from "leaflet";
import { searchPlacesOnline } from "../lib/geocode";
import { LODGINGS } from "../data/beachCatalog";
import { searchLocations, normalizeText } from "../lib/router";
import { hasCoordinates } from "../lib/walking";
import "leaflet/dist/leaflet.css";
const icon = L.divIcon({
  className: "",
  html: '<span class="origin-pin"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});
function Pick({ setPoint }) {
  useMapEvents({
    click: (e) => setPoint({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}
function Center({ point }) {
  const map = useMap();
  useEffect(() => {
    map.setView([point.lat, point.lng], 15);
  }, [map, point]);
  return null;
}
export default function OriginPicker({
  home,
  onChange,
  stops = [],
  cities = [],
  places = [],
}) {
  const valid = hasCoordinates(home),
    inputId = useId();
  const [editing, setEditing] = useState(!valid),
    [query, setQuery] = useState(home?.address || home?.name || "");
  const [results, setResults] = useState(null),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [showMap, setShowMap] = useState(false);
  const [point, setPoint] = useState(
    valid ? home : { lat: -16.8102, lng: -39.1454 },
  );
  const pending = useRef(null);
  useEffect(() => {
    setQuery(home?.address || home?.name || "");
    if (hasCoordinates(home)) setPoint(home);
  }, [home]);
  useEffect(() => () => pending.current?.abort(), []);
  const clearSearch = () => {
    pending.current?.abort();
    pending.current = null;
    setBusy("");
    setResults(null);
    setError("");
  };
  const pick = (item) => {
    clearSearch();
    onChange(item);
    setPoint(item);
    setQuery(item.address || item.name);
    setShowMap(item.source === "researched");
    setEditing(item.source === "researched");
  };
  const localMatches = () => {
    const q = normalizeText(query);
    return [
      ...LODGINGS.filter(
        (i) =>
          q.length >= 3 &&
          (normalizeText(i.name).includes(q) || q.includes("eco glamping")),
      ),
      ...searchLocations(query, stops, places, cities),
    ]
      .filter(
        (i, n, a) =>
          a.findIndex(
            (x) => normalizeText(x.name) === normalizeText(i.name),
          ) === n,
      )
      .slice(0, 4);
  };
  const search = async (e) => {
    e.preventDefault();
    if (busy || query.trim().length < 3) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy("search");
    setError("");
    const local = localMatches();
    setResults(local);
    try {
      const online = await searchPlacesOnline(
        query,
        AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]),
      );
      if (controller.signal.aborted) return;
      const combined = [...local, ...online].filter(
        (i, n, a) =>
          a.findIndex(
            (x) => normalizeText(x.name) === normalizeText(i.name),
          ) === n,
      );
      setResults(combined);
      if (!combined.length)
        setError(
          "Não encontramos esse endereço. Inclua a cidade ou escolha a entrada no mapa.",
        );
    } catch {
      if (!controller.signal.aborted)
        setError(
          local.length
            ? "A busca no mapa está indisponível. Você ainda pode escolher um local da lista."
            : "A busca está indisponível. Marque seu ponto no mapa para continuar.",
        );
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        setBusy("");
      }
    }
  };
  const gps = () => {
    if (!navigator.geolocation) {
      setError("Localização indisponível neste navegador. Escolha no mapa.");
      return;
    }
    clearSearch();
    setBusy("gps");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pick({
          name: "Minha localização",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: "gps",
        });
        setBusy("");
      },
      () => {
        setError(
          "Não foi possível acessar sua localização. Digite o endereço ou escolha no mapa.",
        );
        setBusy("");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };
  const suggestions =
    results ??
    (query.trim().length >= 3 && query !== home?.address && query !== home?.name
      ? localMatches()
      : []);
  return (
    <section
      className={`origin-picker ${editing ? "is-editing" : ""}`}
      aria-label="Seu ponto de partida"
    >
      <div className="origin-summary">
        <span className="origin-icon">
          <MapPin size={21} />
        </span>
        <div className="origin-copy">
          <p className="eyebrow">Seu ponto de partida</p>
          <strong>{valid ? home.name : "De onde você vai sair?"}</strong>
          {valid && (
            <span>
              {home.source === "gps"
                ? "Localização do aparelho"
                : "Origem definida para os passeios"}
            </span>
          )}
        </div>
        <button
          className="icon-button"
          onClick={() => {
            setEditing(!editing);
            clearSearch();
            setQuery(home?.address || home?.name || "");
            setShowMap(false);
          }}
          aria-label={editing ? "Recolher endereço" : "Editar ponto de partida"}
          aria-expanded={editing}
        >
          {editing ? <X size={18} /> : <ChevronDown size={19} />}
        </button>
      </div>
      {editing && (
        <div className="origin-editor">
          <form onSubmit={search}>
            <label htmlFor={inputId} className="field-label">
              Hospedagem, endereço ou cidade
            </label>
            <div className="origin-search-row">
              <div className="search-field">
                <Search size={19} />
                <input
                  id={inputId}
                  value={query}
                  onChange={(e) => {
                    clearSearch();
                    setQuery(e.target.value);
                  }}
                  placeholder="Ex.: hospedagem em Caraíva"
                  autoComplete="off"
                />
              </div>
              <button
                className="button button-primary"
                disabled={!!busy || query.trim().length < 3}
              >
                {busy === "search" ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <ArrowRight size={19} />
                )}
                <span>Buscar</span>
              </button>
            </div>
          </form>
          {suggestions.length > 0 && (
            <div className="origin-results" aria-label="Resultados de endereço">
              {suggestions.map((item, i) => (
                <button key={item.id || i} onClick={() => pick(item)}>
                  <MapPin size={17} />
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.address || item.subtitle || "Local cadastrado"}
                    </small>
                  </span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
          )}
          <div className="origin-actions">
            <button onClick={gps} disabled={!!busy}>
              <Crosshair size={17} />
              {busy === "gps" ? "Localizando…" : "Usar localização"}
            </button>
            <button
              onClick={() => {
                setShowMap(!showMap);
                setError("");
              }}
              aria-expanded={showMap}
            >
              <Map size={17} />
              {showMap ? "Fechar mapa" : "Escolher no mapa"}
            </button>
          </div>
          {error && (
            <p className="inline-notice" role="status">
              {error}
            </p>
          )}
          {showMap && (
            <div className="origin-map-picker">
              <p>
                Toque na entrada da hospedagem. Arraste o mapa para ajustar.
              </p>
              <div className="origin-map">
                <MapContainer center={[point.lat, point.lng]} zoom={15}>
                  <TileLayer
                    attribution="© OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[point.lat, point.lng]} icon={icon} />
                  <Pick setPoint={setPoint} />
                  <Center point={point} />
                </MapContainer>
              </div>
              <button
                className="button button-primary"
                onClick={() => {
                  pick({
                    name: query.trim() || "Ponto escolhido no mapa",
                    lat: point.lat,
                    lng: point.lng,
                    source: "pin",
                  });
                  setShowMap(false);
                  setEditing(false);
                }}
              >
                <Check size={18} />
                Confirmar ponto de partida
              </button>
            </div>
          )}
          {valid && (
            <p className="origin-current">
              <Check size={15} />
              <span>
                Origem atual: <strong>{home.name}</strong>
                {home.accuracy
                  ? ` · precisão de cerca de ${Math.round(home.accuracy)} m`
                  : ""}
              </span>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
