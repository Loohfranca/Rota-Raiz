import React, { useState, useEffect } from 'react';
import { Waves, MapPin, ArrowRight, Bookmark, Search } from 'lucide-react';
import { getPlaces, getStops, getCities, getSavedTours, toggleSaveTourOffline } from '../lib/supabase';
import BeachPhoto from './BeachPhoto';
import OriginPicker from './OriginPicker';
import { BEACHES, LODGINGS } from '../data/beachCatalog';
import { selectBeaches, nearestRegion, REGIONS } from '../lib/nearby';
import { hasCoordinates } from '../lib/walking';
export default function ToursView({ home, onChangeHome, onSelectTour }) {
  const [places, setPlaces] = useState(BEACHES);
  const [stops, setStops] = useState([]);
  const [cities, setCities] = useState(REGIONS);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('auto');
  const [onlySaved, setOnlySaved] = useState(false);
  const [saved, setSaved] = useState(getSavedTours);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([getPlaces(), getStops(), getCities()]).then(([data,s,c]) => {
      if (!active) return;
      // Curated entries replace old versions with the same ID; custom destinations remain available.
      const byId = new Map(data.filter(item => item.id !== 'caraiva-prainha').map(item => [item.id,item]));
      BEACHES.forEach(item => byId.set(item.id,{...byId.get(item.id),...item}));
      setPlaces([...byId.values()]); setStops(s); setCities(c);
    }).catch(() => active && setError('Usando o catálogo disponível neste aparelho.'));
    return () => { active = false; };
  }, []);
  const near = nearestRegion(home);
  const filtered = selectBeaches(onlySaved ? Object.values(saved).map(item => ({...item,...BEACHES.find(b => b.id === item.id)})) : places, { home, region, query, savedIds: onlySaved ? Object.keys(saved) : null });
  const toggle = (place) => { try { toggleSaveTourOffline(place.id, {...place,savedOrigin:home}); setSaved(getSavedTours()); setError(''); } catch {setError('Não foi possível salvar neste dispositivo.');} };
  const open = place => { if (onlySaved && place.savedOrigin) onChangeHome(place.savedOrigin); onSelectTour(place); };
  return <div className="flex flex-col gap-5 pb-8">
    <header><p className="text-xs uppercase tracking-widest text-[#c2461f] font-bold">Seu próximo banho de mar</p><h1 className="text-3xl font-bold mt-1">Praias & passeios</h1><p className="text-sm text-[#59413b] mt-2">Escolha sua origem, descubra as praias e calcule como chegar.</p></header>
    <OriginPicker home={home} onChange={onChangeHome} stops={stops} cities={cities} places={[...places,...LODGINGS.map(item => ({...item,title:item.name}))]} />
    <div className="flex flex-wrap gap-2" role="group" aria-label="Região das praias">
      {[{id:'auto',name:'Perto da minha origem'},...REGIONS,{id:'all',name:'Todas as regiões'}].map(item => <button key={item.id} onClick={() => {setRegion(item.id);setOnlySaved(false);}} aria-pressed={!onlySaved && region===item.id} className={`min-h-[44px] px-3 rounded-xl border text-sm ${!onlySaved && region===item.id ? 'bg-[#c2461f] text-white border-[#c2461f]' : 'bg-white border-[#e0d5c1]'}`}>{item.name}</button>)}
      <button onClick={() => setOnlySaved(!onlySaved)} aria-pressed={onlySaved} className={`min-h-[44px] px-3 rounded-xl border text-sm ${onlySaved?'bg-[#2f5d3a] text-white':'bg-white'}`}>Salvos ({Object.keys(saved).length})</button>
    </div>
    {region==='auto' && !onlySaved && <p className="text-sm">{near ? `Praias de ${near.name}, ordenadas pela proximidade de ${home.name}.` : hasCoordinates(home) ? 'Sua origem está fora das regiões cadastradas. Ainda não há praias próximas no catálogo; explore uma das regiões acima para planejar a viagem.' : 'Escolha sua origem para ver as praias da região. Enquanto isso, explore o catálogo abaixo.'}</p>}
    <label className="flex items-center gap-2 border bg-white rounded-xl px-3"><Search size={18}/><input aria-label="Buscar praia" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar praia ou atrativo" className="min-h-[48px] w-full bg-transparent outline-none" /></label>
    {error && <p role="status">{error}</p>}
    {!(region==='auto' && hasCoordinates(home) && !near && !onlySaved) && <>
    <h2 className="text-xl font-bold">{onlySaved ? 'Meus passeios salvos' : near && region==='auto' ? `Praias em ${near.name}` : 'Explore os destinos'} <span className="text-sm font-normal">({filtered.length})</span></h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filtered.map(place=><article key={place.id} className="rounded-[24px] border border-[#e0d8c9] bg-white overflow-hidden flex flex-col shadow-[0_5px_24px_rgba(52,45,29,0.04)]">
        <div className="relative"><BeachPhoto tour={place} className="h-44"/><span className="absolute bottom-3 left-3 bg-white/95 text-[#516450] text-[10px] px-2.5 py-1.5 rounded-full">{place.location.split(',')[0]}</span></div>
        <div className="p-4 flex flex-col gap-3 flex-1"><h3 className="text-lg font-bold">{place.title}</h3><p className="text-sm text-[#59413b]">{place.subtitle}</p>
          <p className="text-sm font-bold text-[#2f5d3a]">{place.distanceKm != null ? `${Number(place.distanceKm).toLocaleString('pt-BR',{maximumFractionDigits:1})} km em linha reta da origem` : 'Escolha uma origem para medir a distância'}</p>
          <p className="text-xs text-[#777b6a]">{place.essentials?.[0] ? `${place.essentials[0].label}: ${place.essentials[0].value}` : 'Acessos e dicas no guia da praia'}</p>
          <div className="mt-auto flex flex-wrap gap-2"><button onClick={()=>open(place)} className="min-h-[44px] flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#c2461f] text-white px-3 font-bold text-sm">Ver detalhes <ArrowRight size={16}/></button><button aria-label={saved[place.id] ? `Remover ${place.title} dos salvos` : `Salvar ${place.title}`} onClick={()=>toggle(place)} className="min-h-[44px] px-3 border rounded-xl"><Bookmark size={18} className={saved[place.id]?'fill-[#2f5d3a] text-[#2f5d3a]':''}/></button></div>
        </div>
      </article>)}
    </div>
    {!filtered.length && <p>Nenhum destino encontrado. Altere a busca ou escolha outra região.</p>}
    </>}
  </div>;
}
