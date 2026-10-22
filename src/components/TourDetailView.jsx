import React, { useEffect, useState } from 'react';
import { ArrowLeft, Waves, MapPin, Bookmark, Map as MapIcon, ArrowUpRight, Sparkles, ChevronDown } from 'lucide-react';
import AccessGuide from './AccessGuide';
import BeachPhoto from './BeachPhoto';
import { getSavedTours, toggleSaveTourOffline } from '../lib/supabase';
export default function TourDetailView({ tour, home, onBack, onOpenMapWithTour, onSwitchToRoute }) {
  const [saved, setSaved] = useState(() => !!getSavedTours()[tour?.id]);
  const [error,setError] = useState('');
  useEffect(() => { window.scrollTo({top:0,behavior:'instant'}); }, [tour?.id]);
  if (!tour) return null;
  const toggle = () => { try {setSaved(toggleSaveTourOffline(tour.id,{...tour,savedOrigin:home}));setError('');} catch {setError('Não foi possível salvar neste dispositivo.');} };
  const sources = [...new Map([...(tour.guide_sources||[]),...(tour.sources||[])].map(s=>[s.url,s])).values()];
  return <div className="flex flex-col gap-5 pb-8 text-[#283c32]">
    <div className="flex items-center justify-between gap-3"><button onClick={onBack} className="min-h-[44px] flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={17}/>Todas as praias</button><button onClick={toggle} aria-label={saved?'Remover guia dos salvos':'Salvar guia'} className={`min-h-[44px] px-3 rounded-full flex items-center gap-2 text-xs font-bold ${saved?'bg-[#263f35] text-white':'bg-white border border-[#e1d8ca]'}`}><Bookmark size={15} className={saved?'fill-current':''}/>{saved?'Salvo':'Salvar guia'}</button></div>
    <div><BeachPhoto tour={tour} className="h-56 sm:h-80 rounded-[26px]"/>{tour.photo && <p className="text-[10px] text-[#8b8170] mt-1 text-right"><a href={tour.photo.source} target="_blank" rel="noopener noreferrer" className="underline">Foto: {tour.photo.author}</a> · <a href={tour.photo.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{tour.photo.license}</a> · enquadramento de exibição</p>}</div>
    <header className="px-1"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#986547] flex items-center gap-1.5"><MapPin size={13}/>{tour.location}</p><h1 className="font-headline text-3xl sm:text-4xl font-bold leading-tight tracking-tight mt-2">{tour.title}</h1><p className="text-sm sm:text-base leading-relaxed text-[#707464] mt-3 max-w-2xl">{tour.description || tour.subtitle}</p><div className="flex flex-wrap gap-2 mt-4">{tour.highlights?.map(tag=><span key={tag} className="text-[11px] px-3 py-1.5 rounded-full bg-[#e8ebdf] text-[#4e654b]">{tag}</span>)}</div></header>
    {tour.essentials && <div className="grid grid-cols-1 min-[400px]:grid-cols-3 border-y border-[#ddd7c8] py-4 gap-4 mx-1">{tour.essentials.map(item=><div key={item.label}><p className="text-[10px] uppercase tracking-wider text-[#8c806e] mb-1">{item.label}</p><strong className="text-sm">{item.value}</strong></div>)}</div>}
    <AccessGuide key={`${home?.lat},${home?.lng}:${tour.id}`} home={home} tour={tour} onSwitchToRoute={onSwitchToRoute}/>
    <div className="grid sm:grid-cols-2 gap-4">
      <section className="rounded-[22px] p-5 bg-[#e5ece3]"><Waves size={22} className="text-[#4c735b]"/><h2 className="font-bold mt-3">A maré faz diferença</h2><p className="text-sm leading-relaxed text-[#586a56] mt-2">{tour.tide_note || 'Consulte a maré e os acessos antes de sair.'}</p><a className="flex items-center gap-1 text-xs font-bold mt-3 min-h-[44px]" href="https://www.marinha.mil.br/chm/dados-do-segnav-publicacoes/tabuas-das-mares" target="_blank" rel="noopener noreferrer">Consultar tábuas de maré <ArrowUpRight size={14}/></a></section>
      <section className="rounded-[22px] p-5 bg-[#f0e6d7]"><Sparkles size={22} className="text-[#a07644]"/><h2 className="font-bold mt-3">O que você encontra</h2><p className="text-sm leading-relaxed text-[#7e6b50] mt-2">{tour.facilities || tour.access_note || 'Verifique a estrutura e o ponto de acesso antes da visita.'}</p></section>
    </div>
    <button onClick={()=>onOpenMapWithTour(tour)} className="min-h-[48px] rounded-xl border border-[#d9d1c2] flex items-center justify-center gap-2 bg-white/60 text-sm font-semibold"><MapIcon size={17}/>Localizar a praia no mapa</button>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <details className="border-t border-[#ddd7c8] text-xs text-[#7f7b6e] pt-2"><summary className="min-h-[44px] flex items-center justify-between cursor-pointer font-semibold">Fontes, contexto e informações do guia<ChevronDown size={15}/></summary><div className="flex flex-col gap-2 leading-relaxed pb-3">{tour.history && <p>{tour.history}</p>}{sources.map(s=><a key={s.url} href={s.url} className="underline min-h-[32px] flex items-center" target="_blank" rel="noopener noreferrer">{s.title}</a>)}<a href="https://www.ba.gov.br/inema/iniciativas/qualidade-das-praias" className="underline" target="_blank" rel="noopener noreferrer">Boletim de balneabilidade · Inema</a><p>Distâncias e tempos do roteiro são referências a partir do local indicado, não da sua hospedagem. Preços não são cotações. Marés sem atualização em tempo real.</p><p>Salvar o guia guarda os textos neste navegador. O fundo do mapa e as fotos precisam de internet.</p></div></details>
  </div>;
}
