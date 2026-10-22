import React from 'react';
import { Bus, Car, Ship, ChevronDown, Clock, Coins, Plane, ArrowRight, ExternalLink } from 'lucide-react';
import { getJourneyOptions } from '../data/airportJourney';
const icons = { bus: Bus, taxi: Car, car: Car, van: Bus, canoe: Ship, ferry: Ship };
export default function AirportJourney({ journey }) {
  const out = journey.direction === 'outbound';
  const options = getJourneyOptions(journey);
  return <section className="airport-journey" aria-label="Opções para viajar entre Caraíva e o aeroporto">
    <header><span className="eyebrow"><Plane size={16}/> SUA CONEXÃO COM O VOO</span><h2>{out ? 'Caraíva' : 'Aeroporto BPS'} <ArrowRight size={23}/> {out ? 'Aeroporto BPS' : 'Caraíva'}</h2><p>Compare os caminhos. Abra uma opção para ver onde embarcar, trocar de transporte e chegar ao destino.</p></header>
    <p className="journey-context">{journey.mainland ? 'Este roteiro começa ou termina em Nova Caraíva, no lado dos veículos, sem a canoa para a vila.' : 'Roteiro desde ou até a vila de Caraíva. Na vila, o acesso à canoa é a pé; o veículo fica em Nova Caraíva.'}</p>
    <div className="journey-options">{options.map(option => { const Icon = icons[option.mode]; return <details key={`${journey.direction}-${journey.mainland}-${option.id}`} className="journey-option">
      <summary><span className="journey-mode-icon"><Icon size={21}/></span><span className="journey-option-label"><small>{option.tag}</small><strong>{option.title}</strong><span>{option.summary}</span></span><ChevronDown className="journey-chevron" size={20}/></summary>
      <div className="journey-option-content"><div className="journey-estimates"><p><Clock size={17}/><span>{option.duration}</span></p><p><Coins size={17}/><span>{option.cost}</span></p></div>
        <ol className="journey-steps">{option.steps.map((step, index) => { const StepIcon = icons[step.mode]; return <li key={index}><span className="journey-step-number">{index+1}</span><div><h3><StepIcon size={16}/>{step.title}</h3><p>{step.description}</p><small>{step.cost}</small></div></li>; })}</ol>
        <div className="journey-schedule"><h3>Antes de marcar sua saída</h3><p>{option.schedule}</p></div>
        {!!option.actions.length && <div className="journey-actions">{option.actions.map(action => <a key={action.href} href={action.href} {...(action.href.startsWith('http') ? {target:'_blank',rel:'noopener noreferrer'} : {})}>{action.label}<ExternalLink size={15}/></a>)}</div>}
      </div></details>; })}</div>
    <details className="journey-flight-check"><summary><Plane size={18}/> Vai pegar um voo? Confira antes <ChevronDown size={18}/></summary><ul><li>Consulte o limite de check-in e despacho de bagagem da sua companhia.</li><li>Some caminhada, canoa, espera do transporte, estrada e conexões. A duração do ônibus não é o tempo porta a porta.</li><li>Para voo cedo ou sem conexão viável, avalie transfer reservado ou dormir em Porto Seguro na véspera.</li><li>Confirme as saídas na sua data. O app não acompanha atrasos ou vagas em tempo real.</li></ul></details>
    <p className="journey-reviewed">Acessos pesquisados em 22/10/2026. Tarifas e saídas para sua data ainda precisam de confirmação.</p>
  </section>;
}
