import React, { useState } from 'react';
import { Bike, Bus, Car, Footprints, ExternalLink, ArrowUpRight } from 'lucide-react';
import { mapsDirectionsUrl } from '../lib/mapsDirections';
import Sheet from './Sheet';
export default function JourneyLookup({ origin, destination, uncovered = false, modes = null }) {
 const [open,setOpen]=useState(false);
 const choices=[{mode:'transit',label:'Transporte público',Icon:Bus},{mode:'driving',label:'Carro / táxi',Icon:Car},{mode:'walking',label:'A pé',Icon:Footprints},{mode:'bicycling',label:'Bicicleta',Icon:Bike}].filter(i=>!modes||modes.includes(i.mode));
 return <section className="journey-compact"><button onClick={()=>setOpen(true)}><span><b>{uncovered?'Consultar como chegar':'Comparar no Google Maps'}</b><small>{uncovered?'Consultar opções externas para este percurso':'Com sua origem e seu destino'}</small></span><ArrowUpRight size={20}/></button>{open&&<Sheet title="Escolha como ir" onClose={()=>setOpen(false)}><p className="journey-points">{origin.name} → {destination.name}</p>{uncovered&&<p className="field-help">Ainda não há roteiro verificado no Rota Raiz para esses pontos.</p>}<div className="external-mode-grid">{choices.map(({mode,label,Icon})=><a href={mapsDirectionsUrl(origin,destination,mode)} key={mode} target="_blank" rel="noopener noreferrer"><Icon size={22}/><span>{label}</span><ExternalLink size={15}/></a>)}</div><p className="field-help">Abre o Google Maps. Disponibilidade, horários e preços dependem do serviço externo; não são consultados ao vivo pelo app.</p></Sheet>}</section>;
}
