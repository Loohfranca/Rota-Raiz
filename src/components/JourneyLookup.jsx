import React from 'react';
import { Bike, Bus, Car, Footprints, ArrowRight, ExternalLink } from 'lucide-react';
import { mapsDirectionsUrl } from '../lib/mapsDirections';
export default function JourneyLookup({ origin, destination, uncovered = false, modes = null }) {
  const choices = [{mode:'transit',label:'Transporte público',Icon:Bus},{mode:'driving',label:'Carro / táxi',Icon:Car},{mode:'walking',label:'A pé',Icon:Footprints},{mode:'bicycling',label:'Bicicleta',Icon:Bike}];
  return <section className="journey-lookup" aria-label="Consultar o trajeto escolhido">
    <span className="eyebrow">{uncovered ? 'CONSULTE SEU PERCURSO' : 'COMPARE NO GOOGLE MAPS'}</span>
    {uncovered && <h2><span>{origin.name}</span><ArrowRight size={20}/><span>{destination.name}</span></h2>}
    <p>{uncovered ? 'Ainda não temos um roteiro verificado para esses pontos dentro do app. Consulte no Google Maps com a origem e o destino que você escolheu.' : 'Abra a consulta externa com estes mesmos pontos para conferir outras possibilidades.'}</p>
    <div className="journey-lookup-actions">{choices.filter(item=>!modes || modes.includes(item.mode)).map(({mode,label,Icon}) => <a key={mode} href={mapsDirectionsUrl(origin,destination,mode)} target="_blank" rel="noopener noreferrer" aria-label={`Consultar ${label.toLowerCase()} no Google Maps`}><Icon size={19}/><span>{label}</span><ExternalLink size={15}/></a>)}</div>
    <small>Abre o Google Maps. A disponibilidade de cada modo depende do trajeto; preços, horários e percursos ainda não foram consultados pelo Rota Raiz.</small>
  </section>;
}
