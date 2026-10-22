import React from 'react';
import { Plane, ChevronDown, ExternalLink } from 'lucide-react';
import { matchAirport } from '../data/travelNetwork';
export default function AirportAccess({ origin, destination }) {
 const airports=[origin,destination].map(matchAirport).filter((a,n,all)=>a&&all.findIndex(other=>other?.id===a.id)===n);
 if(!airports.length)return null;
 return <section className="airport-access" aria-label="Acesso aos aeroportos selecionados">{airports.map(airport=><details key={airport.id}><summary><Plane size={18}/><span>{airport.title}</span><ChevronDown size={17}/></summary><div><p>{airport.access}</p><a href={airport.source_url} target="_blank" rel="noopener noreferrer">Conferir acesso e operação<ExternalLink size={14}/></a><small>Orientações consultadas em 22/10/2026. Não são horários ou vagas em tempo real.</small></div></details>)}</section>;
}
