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
      address: item.address,
      route_by_name: item.route_by_name,
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
      address: item.address || (item.source === "osm" ? item.subtitle : undefined),
      route_by_name: item.route_by_name,
    });
  };

  const clear = () => {
    requestRef.current?.abort(); setOnline([]); setLoading(false); setSearchError("");
    setText(""); onChange(null); setOpen(true);
  };
  return <div ref={boxRef} className="place-input">
    <div className="place-field" style={{"--place-accent":accent}}>
      <span className="place-dot" aria-hidden="true"/>
      <div className="place-value"><label htmlFor={inputId}>{label}</label>
        <textarea id={inputId} rows={2} value={text} placeholder={placeholder} autoComplete="off"
          onChange={e=>handleType(e.target.value)} onFocus={()=>setOpen(true)}
          onKeyDown={e=>{if(e.key==='Escape')setOpen(false);if(e.key==='Enter'){e.preventDefault();searchMap();}}}/>
      </div>
    </div>
    {open && <div className="place-tools">
      <button type="button" onClick={searchMap} disabled={loading || text.trim().length<3 || !navigator.onLine} aria-label={`Buscar ${label.toLowerCase()} no mapa`}><Search size={16}/><span>{loading?'Buscando…':'Buscar no mapa'}</span></button>
      {onGps && <button type="button" onClick={onGps} disabled={gpsLoading}><Navigation size={16}/><span>Usar GPS</span></button>}
      {text && <button type="button" onClick={clear} aria-label={`Limpar ${label.toLowerCase()}`} className="place-clear"><X size={17}/><span>Limpar</span></button>}
      {rightSlot}
    </div>}
    {open && (suggestions.length>0 || loading || searchError) && <div className="place-suggestions">
      {suggestions.map(item=><button key={item.id} type="button" onClick={()=>handlePick(item)}><MapPin size={17}/><span><strong>{item.name}</strong><small>{item.subtitle}</small></span></button>)}
      {searchError && <p role="status">{searchError}</p>}
      {loading && <p role="status">Buscando no mapa…</p>}
    </div>}
  </div>;
}
