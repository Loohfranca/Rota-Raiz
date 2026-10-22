import React, { useState } from 'react';
import { Footprints, Ship, Car, Bus, Clock, Coins, ArrowUpRight, Info, Navigation } from 'lucide-react';
import WalkingPanel from './WalkingPanel';
const icons={walk:Footprints,boat:Ship,road:Car,transit:Bus};
export default function AccessGuide({tour,home,onSwitchToRoute}){
 const options=tour.access_options||[],[active,setActive]=useState(options[0]?.id||'walk');
 const choice=options.find(i=>i.id===active);
 if(!choice)return <WalkingPanel home={home} tour={tour}/>;
 return <section className="access-guide"><div className="access-heading"><p className="eyebrow">O caminho faz parte</p><h2>Como você quer ir?</h2><p>Escolha seu jeito de chegar.</p></div>
   <div className="access-modes" role="group" aria-label="Opções de acesso">{options.map(i=>{const Icon=icons[i.id]||Footprints;return <button key={i.id} onClick={()=>setActive(i.id)} aria-pressed={active===i.id}><Icon size={20}/><span>{i.title}</span></button>;})}</div>
   <div className="access-content"><div className="reference-origin"><Navigation size={17}/><div><span>Saindo de</span><strong>{choice.from}</strong></div></div>
     <div className="access-metrics"><div><Footprints size={17}/><span>Distância de referência</span><strong>{choice.distance}</strong></div><div><Clock size={17}/><span>Tempo de referência</span><strong>{choice.duration}</strong></div></div>
     <ol className="access-timeline">{choice.steps.map((step,i)=><li key={i}><span className="step-dot">{i+1}</span><p>{step}</p></li>)}</ol>
     <div className="access-price"><Coins size={19}/><div><strong>{choice.price}</strong><span>Confirme valor, operação e retorno no dia.</span></div></div>
     {choice.note&&<div className="access-note"><Info size={18}/><p>{choice.note}</p></div>}
     {active==='walk'&&(tour.coastal_reference?<details className="automatic-route"><summary>Calcular também desde minha origem <ArrowUpRight size={17}/></summary><p>O roteiro costeiro acima depende de canoa e maré. O cálculo automático pode seguir outro caminho.</p><WalkingPanel home={home} tour={tour}/></details>:<WalkingPanel home={home} tour={tour}/>)}
     {active==='transit'&&<button onClick={()=>onSwitchToRoute(tour.title)} className="button button-primary">Consultar linhas cadastradas <ArrowUpRight size={17}/></button>}
   </div>
 </section>;
}
