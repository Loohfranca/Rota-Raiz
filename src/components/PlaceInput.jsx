import React, { useState, useEffect, useRef, useMemo, useId } from "react";
import { MapPin, Navigation, X } from "lucide-react";
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

  // Mantém o texto sincronizado quando o valor muda por fora (inverter, GPS, usar ponto próximo)
  useEffect(() => {
    setText(value?.name || "");
  }, [value?.name]);

  useEffect(() => {
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  // Busca online com atraso (debounce) para respeitar o limite do serviço gratuito
  useEffect(() => {
    if (!open) return undefined;
    const q = text.trim();
    if (q.length < 3 || !navigator.onLine) {
      setOnline([]);
      return undefined;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        setOnline(await searchPlacesOnline(q, ctrl.signal));
      } catch (err) {
        if (err.name !== "AbortError") setOnline([]);
      } finally {
        setLoading(false);
      }
    }, 700);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [text, open]);

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
    setText(val);
    setOpen(true);
    onChange(val.trim() ? { name: val } : null);
  };

  const handlePick = (item) => {
    setText(item.name);
    setOpen(false);
    onChange({
      name: item.name,
      lat: item.lat ?? null,
      lng: item.lng ?? null,
      stopId: item.stopId || null,
      source: item.source,
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

      {open && (suggestions.length > 0 || loading) && (
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
