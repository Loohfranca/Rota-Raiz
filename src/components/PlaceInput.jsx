import React, { useState, useEffect, useRef, useMemo, useId } from "react";
import { MapPin, Navigation, Search, X } from "lucide-react";
import { searchLocations, normalizeText } from "../lib/router";
import { searchPlacesOnline } from "../lib/geocode";

// Campo de lugar com autocomplete:
// 1) lugares cadastrados no banco (funciona offline)
// 2) qualquer lugar do Brasil via OpenStreetMap (quando há internet)
export default function PlaceInput({
  label,
  value,
  onChange,
  placeholder,
  stops = [],
  places = [],
  cities = [],
  accent = "#c2461f",
  onGps,
  gpsLoading = false,
  rightSlot = null,
}) {
  const inputId = useId();
  const [text, setText] = useState(value?.name || "");
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const requestRef = useRef(null);
  const [searchError, setSearchError] = useState("");

  // Mantém o texto sincronizado quando o valor muda por fora (inverter, GPS, usar ponto próximo)
  useEffect(() => {
    setText(value?.name || "");
    requestRef.current?.abort();
    setOnline([]);
    setLoading(false);
    setSearchError("");
  }, [value?.name]);

  useEffect(() => {
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  useEffect(() => () => requestRef.current?.abort(), []);

  const searchMap = async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const q = text.trim();
    if (q.length < 3) return;
    setSearchError("");
    setLoading(true);
    setOpen(true);
    try {
      const results = await searchPlacesOnline(q, controller.signal);
      if (controller.signal.aborted) return;
      setOnline(results);
      if (!results.length) setSearchError("Nenhum endereço encontrado. Inclua cidade e estado, ou mantenha o texto para consultar o trajeto.");
    } catch (error) {
      if (error.name !== "AbortError") setSearchError("Não foi possível localizar agora. Você pode manter o endereço digitado e consultar o trajeto.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const suggestions = useMemo(() => {
    const local = searchLocations(text, stops, places, cities).map((item) => ({
      id: item.id,
      name: item.name,
      subtitle: item.subtitle || "Cadastrado",
      lat: item.lat,
      lng: item.lng,
      stopId: item.stopId,
      source: "local",
    }));
    const seen = new Set(local.map((l) => normalizeText(l.name)));
    const extra = online.filter((o) => !seen.has(normalizeText(o.name)));
    return [...local, ...extra];
  }, [text, stops, places, cities, online]);

  const handleType = (val) => {
    requestRef.current?.abort();
    setOnline([]);
    setLoading(false);
    setSearchError("");
    setText(val);
    setOpen(true);
    onChange(val.trim() ? { name: val } : null);
  };

  const handlePick = (item) => {
    requestRef.current?.abort();
    setLoading(false);
    setSearchError("");
    setText(item.name);
    setOpen(false);
    onChange({
      name: item.name,
      lat: item.lat ?? null,
      lng: item.lng ?? null,
      stopId: item.stopId || null,
      source: item.source,
      address: item.source === "osm" ? (item.address || item.subtitle) : undefined,
    });
  };

  return (
    <div ref={boxRef} className="place-input relative">
      <div
        className="flex items-center gap-3 bg-[#fdf2e7] rounded-xl pl-3.5 pr-2 min-h-[56px] border border-[#e0d5c1] focus-within:ring-2"
        style={{ "--tw-ring-color": accent }}
      >
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: accent }}
          aria-hidden="true"
        />
        <div className="flex flex-col flex-1 min-w-0 py-1.5">
          <label
            htmlFor={inputId}
            className="text-[11px] font-bold text-[#59413b] uppercase leading-none mb-1"
          >
            {label}
          </label>
          <input
            id={inputId}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter") { e.preventDefault(); searchMap(); }
            }}
            type="text"
            value={text}
            onChange={(e) => handleType(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            autoComplete="off"
            className="text-base font-medium text-[#201b15] bg-transparent focus:outline-none w-full truncate placeholder:text-[#59413b]/60"
          />
        </div>

        {text && (
          <button
            type="button"
            onClick={() => {
              requestRef.current?.abort();
              setOnline([]);
              setLoading(false);
              setSearchError("");
              setText("");
              onChange(null);
              setOpen(true);
            }}
            aria-label="Limpar"
            className="w-9 h-11 flex items-center justify-center text-[#59413b] shrink-0"
          >
            <X size={16} />
          </button>
        )}

        <button type="button" onClick={searchMap} disabled={loading || text.trim().length < 3 || !navigator.onLine} aria-label={`Buscar ${label.toLowerCase()} no mapa`} className="place-search-button"><Search size={18}/></button>
        {onGps && (
          <button
            type="button"
            onClick={onGps}
            disabled={gpsLoading}
            aria-label="Usar minha localização"
            className="w-11 h-11 rounded-xl bg-[#2f5d3a]/10 text-[#2f5d3a] flex items-center justify-center shrink-0 active:scale-95"
          >
            <Navigation
              size={18}
              className={gpsLoading ? "animate-spin" : ""}
            />
          </button>
        )}
        {rightSlot}
      </div>

      {open && (suggestions.length > 0 || loading || searchError) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e0d5c1] rounded-xl shadow-lg z-30 max-h-64 overflow-y-auto">
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handlePick(item)}
              className="w-full text-left px-3.5 min-h-[48px] py-2 hover:bg-[#f7ece2] flex items-center gap-2.5 border-b border-[#f7ece2] last:border-0"
            >
              <MapPin
                size={16}
                className="shrink-0"
                style={{ color: item.source === "osm" ? "#59413b" : accent }}
              />
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-[#201b15] truncate">
                  {item.name}
                </span>
                <span className="text-xs text-[#59413b] truncate">
                  {item.source === "osm"
                    ? `Mapa · ${item.subtitle}`
                    : item.subtitle}
                </span>
              </span>
            </button>
          ))}
          {searchError && <p role="status" className="px-3.5 py-3 text-xs text-[#59413b]">{searchError}</p>}
          {loading && (
            <div className="px-3.5 py-2.5 text-xs text-[#59413b]">
              Buscando no mapa…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
