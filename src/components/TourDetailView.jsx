import React, { useState } from 'react';
import { ArrowLeft, Waves, MapPin, Bookmark, Map } from 'lucide-react';
import WalkingPanel from './WalkingPanel';
import { getSavedTours, toggleSaveTourOffline } from '../lib/supabase';
export default function TourDetailView({ tour, home, onBack, onOpenMapWithTour, onSwitchToRoute }) {
  const [saved, setSaved] = useState(() => !!getSavedTours()[tour?.id]);
  const [error,setError] = useState('');
  if (!tour) return null;
  const toggle = () => { try {setSaved(toggleSaveTourOffline(tour.id,{...tour,savedOrigin:home}));setError('');} catch {setError('Não foi possível salvar neste dispositivo.');} };
  return <div className="flex flex-col gap-4 pb-8">
    <div className="flex flex-wrap justify-between gap-2"><button onClick={onBack} className="min-h-[44px] flex items-center gap-2 px-3 bg-white border rounded-xl"><ArrowLeft size={16}/>Passeios</button><button onClick={toggle} className="min-h-[44px] flex items-center gap-2 px-3 bg-white border rounded-xl"><Bookmark size={16} className={saved?'fill-[#2f5d3a]':''}/>{saved?'Remover dos salvos':'Salvar guia'}</button></div>
    <header className="rounded-2xl bg-gradient-to-br from-[#2f5d3a] to-[#164e63] p-5 text-white"><Waves size={36}/><p className="text-xs mt-5 flex items-center gap-1"><MapPin size={14}/>{tour.location}</p><h1 className="text-3xl font-bold mt-2">{tour.title}</h1><p className="text-sm mt-2">{tour.subtitle}</p></header>
    <section className="bg-white border border-[#e0d5c1] rounded-2xl p-4"><h2 className="font-bold text-lg">Sobre a praia</h2><p className="text-sm leading-relaxed mt-2">{tour.history || tour.description || 'Consulte as fontes e os acessos locais antes de planejar a visita.'}</p>{tour.access_note && <p className="text-sm leading-relaxed mt-3">{tour.access_note}</p>}</section>
    <section className="bg-[#fdf2e7] border border-[#e0d5c1] rounded-2xl p-4"><h2 className="font-bold flex items-center gap-2"><Waves size={18}/>Maré & condições</h2><p className="text-sm mt-2">{tour.tide_note || 'Confira a maré, as ondas e a disponibilidade dos acessos antes de sair.'}</p><p className="text-xs text-[#59413b] mt-2">Orientação geral; sem previsão de horário ou altura da maré em tempo real neste app.</p><div className="flex flex-wrap gap-3 mt-3 text-sm"><a className="underline min-h-[44px] flex items-center" href="https://www.marinha.mil.br/chm/dados-do-segnav-publicacoes/tabuas-das-mares" target="_blank" rel="noopener noreferrer">Consultar tábuas da Marinha</a><a className="underline min-h-[44px] flex items-center" href="https://www.ba.gov.br/inema/iniciativas/qualidade-das-praias" target="_blank" rel="noopener noreferrer">Balneabilidade · Inema</a></div></section>
    <WalkingPanel key={`${home?.lat},${home?.lng}:${tour.id}`} home={home} tour={tour} onSwitchToRoute={onSwitchToRoute}/>
    <button onClick={()=>onOpenMapWithTour(tour)} className="min-h-[44px] rounded-xl border bg-white p-3 flex items-center justify-center gap-2"><Map size={18}/>Ver a praia no mapa geral</button>
    {error && <p role="alert">{error}</p>}
    <p className="text-xs text-[#59413b]">O guia fica em Passeios → Salvos neste navegador. O fundo do mapa e as fotos não são baixados.</p>
    <details className="text-xs text-[#59413b] border rounded-xl p-3"><summary className="cursor-pointer min-h-[32px]">Fontes e localização</summary><p className="mt-2">{tour.coordinate_note}</p>{tour.coordinate_source && <a className="block underline py-2" href={tour.coordinate_source} target="_blank" rel="noopener noreferrer">Referência da praia no OpenStreetMap</a>}{tour.sources?.map((source,i)=><a key={source.url} className="block underline py-2 break-all" href={source.url} target="_blank" rel="noopener noreferrer">{source.title} {i+1}</a>)}{tour.reviewed_at && <p>Conteúdo revisado em {tour.reviewed_at.split('-').reverse().join('/')}.</p>}</details>
  </div>;
}
