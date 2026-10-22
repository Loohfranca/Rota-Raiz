import React, { useEffect, useState } from 'react';
import { ArrowLeft, Waves, MapPin, Bookmark, Map as MapIcon, ArrowUpRight, Coffee, ChevronDown } from 'lucide-react';
import AccessGuide from './AccessGuide';
import BeachPhoto from './BeachPhoto';
import { getSavedTours, toggleSaveTourOffline } from '../lib/supabase';
export default function TourDetailView({tour,home,onBack,onOpenMapWithTour,onSwitchToRoute}){
 const [saved,setSaved]=useState(()=>!!getSavedTours()[tour?.id]),[error,setError]=useState('');
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[tour?.id]);
 if(!tour)return null;
 const toggle=()=>{try{setSaved(toggleSaveTourOffline(tour.id,{...tour,savedOrigin:home}));setError('');}catch{setError('Não foi possível salvar neste aparelho.');}};
 const sources=[...new Map([...(tour.guide_sources||[]),...(tour.sources||[])].map(s=>[s.url,s])).values()];
 return <div className="tour-detail">
   <div className="detail-topbar"><button className="back-button" onClick={onBack}><ArrowLeft size={18}/>Voltar aos lugares</button><button className={`button button-secondary ${saved?'is-saved':''}`} onClick={toggle} aria-pressed={saved}><Bookmark size={17} fill={saved?'currentColor':'none'}/>{saved?'Guia salvo':'Salvar guia'}</button></div>
   <div className="detail-hero"><BeachPhoto tour={tour} className="detail-photo"/><button className="photo-map-button" onClick={()=>onOpenMapWithTour(tour)}><MapIcon size={18}/>Ver no mapa <ArrowUpRight size={16}/></button></div>
   {tour.photo&&<p className="photo-credit"><a href={tour.photo.source} target="_blank" rel="noopener noreferrer">{tour.photo.author}</a> · <a href={tour.photo.licenseUrl} target="_blank" rel="noopener noreferrer">{tour.photo.license}</a> · foto enquadrada</p>}
   <header className="detail-intro"><p className="eyebrow"><MapPin size={14}/>{tour.location}</p><h1>{tour.title}</h1><p className="detail-description">{tour.description||tour.subtitle}</p><div className="detail-highlights">{tour.highlights?.map(tag=><span key={tag}>{tag}</span>)}</div></header>
   <div className="detail-columns"><div className="detail-main"><AccessGuide key={`${home?.lat},${home?.lng}:${tour.id}`} home={home} tour={tour} onSwitchToRoute={onSwitchToRoute}/></div><aside className="detail-aside">
     <section className="travel-note tide-note"><span className="note-icon"><Waves size={23}/></span><p className="eyebrow">Antes de sair</p><h2>De olho na maré</h2><p>{tour.tide_note||'Consulte a maré e os acessos antes de sair.'}</p><a href="https://www.marinha.mil.br/chm/dados-do-segnav-publicacoes/tabuas-das-mares" target="_blank" rel="noopener noreferrer">Consultar a tábua <ArrowUpRight size={16}/></a></section>
     <section className="travel-note"><span className="note-icon"><Coffee size={23}/></span><h2>Por lá, você encontra</h2><p>{tour.facilities||tour.access_note||'Confira a estrutura e o acesso antes da visita.'}</p></section>
   </aside></div>
   {error&&<p role="alert" className="inline-notice">{error}</p>}
   <details className="guide-sources"><summary>Sobre este guia e fontes <ChevronDown size={17}/></summary><div>{tour.history&&<p>{tour.history}</p>}{sources.map(s=><a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<ArrowUpRight size={14}/></a>)}<a href="https://www.ba.gov.br/inema/iniciativas/qualidade-das-praias" target="_blank" rel="noopener noreferrer">Balneabilidade · Inema<ArrowUpRight size={14}/></a><p>Distâncias e tempos se referem ao ponto de saída indicado. Preços são referências; confirme no dia. A maré não é atualizada em tempo real.</p><p>O guia salvo guarda os textos neste navegador. Fotos e fundo do mapa precisam de conexão.</p></div></details>
 </div>;
}
