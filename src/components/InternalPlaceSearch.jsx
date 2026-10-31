import React, { useEffect, useId, useRef, useState } from "react";
import { MapPin, Plus, Search, X } from "lucide-react";
import { internalPlaceSearch } from "../lib/internalPlaceSearch";
import "./InternalPlaceSearch.css";

export default function InternalPlaceSearch({ value, onChange, onSelect, onCreate,
  label = "Nome do lugar", disabled = false, api = internalPlaceSearch }) {
  const id = useId();
  const [open, setOpen] = useState(false), [items, setItems] = useState([]), [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false), [error, setError] = useState("");
  const [destination, setDestination] = useState(null), [selecting, setSelecting] = useState(false);
  const detailRequest = useRef(null), revision = useRef(0);
  useEffect(() => () => { detailRequest.current?.abort(); revision.current++; }, []);
  useEffect(() => {
    if (!open || (!value.trim() && !destination)) return;
    const controller = new AbortController(); let current = true;
    // Loading mirrors the external catalog request lifecycle.
    setLoading(true); setItems([]); setError(""); setActive(-1);
    const timer = setTimeout(async () => {
      try { const found = await api.search(value, { destinationId: destination?.id || null, signal: controller.signal });
        if (current) setItems(found || []);
      } catch (err) { if (current && !controller.signal.aborted) setError(err.message); }
      finally { if (current) setLoading(false); }
    }, 180);
    return () => { current = false; clearTimeout(timer); controller.abort(); };
  }, [value, destination, open, api]);
  async function choose(item) {
    if (item.kind === "destination") {
      setDestination(item); onChange(""); setActive(-1); setItems([]); return;
    }
    detailRequest.current?.abort(); const controller = new AbortController(); detailRequest.current = controller;
    const token = ++revision.current; setSelecting(true); setError("");
    try { const full = await api.getPlace(item.id, controller.signal);
      if (token === revision.current && !controller.signal.aborted) { onSelect(full); setOpen(false); }
    } catch (err) { if (!controller.signal.aborted && token === revision.current) setError(err.message); }
    finally { if (token === revision.current) setSelecting(false); }
  }
  function change(text) {
    revision.current++; detailRequest.current?.abort(); setSelecting(false);
    setItems([]); setActive(-1); setError(""); onChange(text); setOpen(true);
  }
  return <div className="rr-internal-search" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <label htmlFor={id}>{label}</label>
    {destination && <div className="rr-search-scope"><MapPin size={14}/><span>Lugares em {destination.name}</span>
      <button type="button" aria-label="Remover filtro de destino" onClick={() => { setDestination(null); change(""); }}><X size={16}/></button></div>}
    <div className="rr-internal-search-input"><Search size={18} aria-hidden="true"/>
      <input id={id} name="name" role="combobox" aria-autocomplete="list" aria-controls={`${id}-results`}
        aria-expanded={open && !!(value.trim() || destination)} aria-activedescendant={open && items[active] ? `${id}-option-${active}` : undefined}
        autoComplete="off" maxLength={120} required value={value} disabled={disabled}
        placeholder="Busque lugar, cidade ou destino" onChange={e => change(e.target.value)} onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (e.key === "Escape") { setOpen(false); setActive(-1); }
          if (e.key === "ArrowDown" && items.length) { e.preventDefault(); setOpen(true); setActive(n => (n + 1) % items.length); }
          if (e.key === "ArrowUp" && items.length) { e.preventDefault(); setActive(n => (n - 1 + items.length) % items.length); }
          if (e.key === "Enter" && open && (value.trim() || destination)) { e.preventDefault(); if (active >= 0 && !selecting) choose(items[active]); }
        }}/>
    </div>
    {open && !!(value.trim() || destination) && <div className="rr-internal-search-results">
      {(loading || selecting) && <p role="status">{selecting ? "Abrindo lugar…" : "Buscando no Rota Raiz…"}</p>}
      {error && <p role="alert">{error} <button type="button" onClick={() => { setOpen(false); setTimeout(() => setOpen(true), 0); }}>Tentar novamente</button></p>}
      <ul id={`${id}-results`} role="listbox" aria-label="Lugares do Rota Raiz">
        {items.map((item, index) => <li key={`${item.kind}-${item.id}`} role="presentation">
          <button type="button" role="option" id={`${id}-option-${index}`} aria-selected={active === index} disabled={selecting}
            onMouseDown={e => e.preventDefault()} onClick={() => choose(item)}>
            <MapPin size={17}/><span><strong>{item.name}</strong><small>{item.category} · {[item.destination !== item.name && item.destination, item.municipality, item.state].filter(Boolean).join(" · ")}</small></span>
          </button></li>)}
      </ul>
      {!loading && !selecting && !error && !items.length && <p>Nenhum lugar cadastrado encontrado.</p>}
      {!loading && !selecting && <button type="button" className="rr-search-create" onClick={() => { setOpen(false); onCreate(value, destination); }}><Plus size={16}/> Cadastrar novo lugar</button>}
    </div>}
  </div>;
}

export function PlaceDuplicateNotice({ name, address, city, state, onSelect, api = internalPlaceSearch }) {
  const [matches, setMatches] = useState([]), [error, setError] = useState("");
  const [busy, setBusy] = useState(false); const currentChoice = useRef(0);
  useEffect(() => {
    currentChoice.current++; const controller = new AbortController(); let current = true;
    // Clear stale external matches before starting the next request.
    setMatches([]); setError(""); setBusy(false);
    if (!name.trim() || !city.trim()) return;
    const timer = setTimeout(async () => {
      try { const result = await api.duplicates({ name, address, city, state }, controller.signal); if (current) setMatches(result || []); }
      catch { if (current && !controller.signal.aborted) setError("Não foi possível conferir possíveis duplicatas."); }
    }, 300);
    // Invalidate an in-flight selection on prop change/unmount; this is not a DOM ref.
    return () => { current = false; clearTimeout(timer); controller.abort(); currentChoice.current++; };
  }, [name, address, city, state, api]);
  if (!matches.length && !error) return null;
  return <div className="rr-place-duplicates" aria-label="Conferir lugares existentes">
    {error ? <p role="status">{error}</p> : <><p>Já existe um lugar com este nome. Confira a localização antes de cadastrar.</p>
      {matches.map(place => <button type="button" disabled={busy} key={place.id} onClick={async () => {
        const token = ++currentChoice.current; setBusy(true);
        try { const full = await api.getPlace(place.id); if (token === currentChoice.current) onSelect(full); }
        catch (err) { if (token === currentChoice.current) setError(err.message); }
        finally { if (token === currentChoice.current) setBusy(false); }
      }}><strong>{place.name}</strong><small>{place.address || "Ponto no mapa"} · {place.municipality} · {place.state}</small>
        <small>{place.possible_duplicate ? "Nome e localização coincidem. Conferir este lugar" : "Mesmo nome; confirme se é o seu lugar"}</small></button>)}</>}
  </div>;
}
