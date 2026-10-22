import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { searchPlacesOnline } from '../lib/geocode';
import { LODGINGS } from '../data/beachCatalog';
import { searchLocations, normalizeText } from '../lib/router';
import { hasCoordinates } from '../lib/walking';
import 'leaflet/dist/leaflet.css';
const icon = L.divIcon({ className: '', html: '<span style="display:block;width:22px;height:22px;background:#c2461f;border:3px solid white;border-radius:50%;box-shadow:0 1px 5px #333"></span>', iconSize: [22,22], iconAnchor: [11,11] });
function Pick({ setPoint }) { useMapEvents({ click: e => setPoint({ lat: e.latlng.lat, lng: e.latlng.lng }) }); return null; }
function Center({ point }) { const map = useMap(); useEffect(() => { map.setView([point.lat, point.lng], 15); }, [map, point]); return null; }
export default function OriginPicker({ home, onChange, stops, cities, places }) {
  const query = home?.address || home?.name || '';
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [point, setPoint] = useState(hasCoordinates(home) ? home : { lat: -16.8102, lng: -39.1454 });
  const pick = item => { onChange(item); setResults([]); setPoint(item); setError(''); if (item.source === 'researched') setShowMap(true); };
  const search = async event => {
    event.preventDefault(); if (busy || query.trim().length < 3) return;
    setBusy(true); setError('');
    const local = [...LODGINGS.filter(() => normalizeText(query).includes('eco glamping')), ...searchLocations(query, stops, places, cities)];
    setResults(local);
    try { const online = await searchPlacesOnline(query, AbortSignal.timeout(12000)); setResults([...local, ...online]); if (!online.length && !local.length) setError('Endereço não encontrado. Tente rua + bairro + cidade, use o GPS ou marque o ponto no mapa.'); }
    catch { setError('Busca online indisponível. Use uma sugestão cadastrada ou marque o ponto no mapa.'); }
    finally { setBusy(false); }
  };
  const gps = () => {
    if (!navigator.geolocation) { setError('Seu navegador não oferece localização.'); return; }
    setBusy(true); setError('');
    navigator.geolocation.getCurrentPosition(pos => { pick({ name: 'Minha localização', lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, source: 'gps' }); setBusy(false); }, () => { setError('Não foi possível localizar. Permita o GPS ou marque o ponto no mapa.'); setBusy(false); }, { enableHighAccuracy: true, timeout: 15000 });
  };
  const lodgingMatches = LODGINGS.filter(item => normalizeText(query).includes('eco glamping') || normalizeText(item.name).includes(normalizeText(query)) && query.length > 3);
  const suggestions = lodgingMatches.length ? lodgingMatches : query.length >= 3 ? searchLocations(query, stops, places, cities).slice(0,4) : [];
  return <section className="bg-white rounded-2xl border border-[#e0d5c1] p-4 flex flex-col gap-3">
    <h2 className="font-bold">De onde você vai sair?</h2>
    <form onSubmit={search} className="flex flex-col sm:flex-row gap-2">
      <label className="flex-1 min-w-0"><span className="sr-only">Endereço da hospedagem ou ponto de partida</span><input value={query} onChange={e => { onChange(e.target.value.trim() ? {name:e.target.value} : null); setResults([]); }} placeholder="Hospedagem, rua, bairro e cidade" className="w-full min-h-[48px] px-3 rounded-xl border border-[#e0d5c1]" /></label>
      <button disabled={busy || query.trim().length < 3} className="min-h-[48px] rounded-xl px-4 bg-[#2f5d3a] disabled:opacity-50 text-white">{busy ? 'Localizando…' : 'Buscar endereço'}</button>
    </form>
    <div className="flex flex-wrap gap-2">{(results.length ? results : suggestions).map((item,i) => <button key={item.id || i} onClick={() => pick(item)} className="w-full text-left p-3 rounded-xl bg-[#f7ece2] min-h-[44px]"><strong>{item.name}</strong><span className="block text-xs">{item.address || item.subtitle}</span></button>)}</div>
    {!home && <button onClick={() => pick(LODGINGS[0])} className="min-h-[44px] text-left text-sm underline">Usar Eco Glamping Caraiva e conferir no mapa</button>}
    <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={gps} className="min-h-[44px] px-3 rounded-xl border">Usar minha localização</button><button onClick={() => setShowMap(!showMap)} className="min-h-[44px] px-3 rounded-xl border">{showMap ? 'Fechar mapa' : 'Marcar / conferir no mapa'}</button></div>
    {error && <p role="status" className="text-sm text-[#a02e06]">{error}</p>}
    {showMap && <><p className="text-xs">Toque na entrada da hospedagem e confirme. Arraste o mapa para procurar o local.</p><div className="h-72 rounded-xl overflow-hidden"><MapContainer center={[point.lat,point.lng]} zoom={15} className="h-full w-full"><TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Marker position={[point.lat,point.lng]} icon={icon} /><Pick setPoint={setPoint} /><Center point={point} /></MapContainer></div><button onClick={() => { pick({ name: query || 'Ponto escolhido no mapa', lat: point.lat, lng: point.lng, source: 'pin' }); setShowMap(false); }} className="min-h-[44px] bg-[#c2461f] text-white rounded-xl p-3">Confirmar este ponto de partida</button></>}
    {hasCoordinates(home) && <p className="text-sm text-[#2f5d3a]">Origem selecionada: <strong>{home.name}</strong><span className="block text-xs">{Number(home.lat).toFixed(6)}, {Number(home.lng).toFixed(6)}{home.accuracy ? ` · Precisão do GPS: aproximadamente ${Math.round(home.accuracy)} m` : ''}</span></p>}
  </section>;
}
