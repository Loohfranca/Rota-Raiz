import React, { useState } from 'react';
import { Footprints, Ship, Car, Bus, Clock, Coins, ArrowUpRight, Info } from 'lucide-react';
import WalkingPanel from './WalkingPanel';
const icons = {walk:Footprints, boat:Ship, road:Car, transit:Bus};
export default function AccessGuide({ tour, home, onSwitchToRoute }) {
  const options = tour.access_options || [];
  const [active, setActive] = useState(options[0]?.id || 'walk');
  const choice = options.find(option=>option.id===active);
  if (!choice) return <WalkingPanel home={home} tour={tour} onSwitchToRoute={onSwitchToRoute}/>;
  return <section className="rounded-[24px] border border-[#e1d8ca] bg-white overflow-hidden shadow-[0_4px_24px_rgba(52,45,29,0.03)]">
    <div className="p-5 sm:p-6 pb-4"><p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#a55435]">Planeje o caminho</p><h2 className="font-headline text-2xl font-bold mt-1">Como você quer ir?</h2></div>
    <div className="px-5 sm:px-6 flex flex-wrap gap-2" role="group" aria-label="Opções de acesso">{options.map(option=>{const Icon=icons[option.id]||Footprints;return <button key={option.id} onClick={()=>setActive(option.id)} aria-pressed={active===option.id} className={`flex items-center justify-center gap-2 min-h-[46px] px-4 py-2 rounded-xl text-sm transition-colors ${active===option.id?'bg-[#263f35] text-white shadow-sm':'bg-[#f7f5ef] text-[#5c6358] hover:bg-[#eee9df]'}`}><Icon size={17}/>{option.title}</button>;})}</div>
    <div className="p-5 sm:p-6 flex flex-col gap-5">
      <div><span className="text-[11px] font-bold uppercase tracking-wider text-[#8b7862]">Roteiro de referência</span><p className="text-sm mt-1 font-semibold text-[#33483d]">{choice.from}</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div className="p-3 rounded-xl bg-[#f6f7f2]"><p className="text-[11px] text-[#6e7569] mb-1 flex items-center gap-1"><Footprints size={13}/>Distância de referência</p><strong className="text-sm">{choice.distance}</strong></div><div className="p-3 rounded-xl bg-[#f6f7f2]"><p className="text-[11px] text-[#6e7569] mb-1 flex items-center gap-1"><Clock size={13}/>Tempo de referência</p><strong className="text-sm">{choice.duration}</strong></div></div>
      <ol className="flex flex-col gap-4">{choice.steps.map((step,i)=><li key={i} className="flex gap-3 items-start"><span className="shrink-0 w-7 h-7 rounded-full bg-[#f0e6d8] text-[#865b36] font-bold text-xs flex items-center justify-center">{i+1}</span><p className="text-sm text-[#4d554a] leading-relaxed pt-0.5">{step}</p></li>)}</ol>
      <div className="border-t border-[#eee9df] pt-4 flex gap-2 items-start text-sm"><Coins size={17} className="text-[#9a6e3d] shrink-0 mt-0.5"/><div><span className="font-semibold">{choice.price}</span><p className="text-xs text-[#827867] mt-1">Valores de referência; confirme a operação e o preço no dia.</p></div></div>
      {choice.note && <div className="flex gap-2 bg-[#fbf4e8] rounded-xl p-3 text-xs leading-relaxed text-[#806135]"><Info size={16} className="shrink-0 mt-0.5"/><p>{choice.note}</p></div>}
      {active==='walk' && (tour.coastal_reference ? <details className="border-t border-[#eee9df] pt-4"><summary className="font-bold text-sm min-h-[44px] cursor-pointer">Consultar também o traçado automático</summary><p className="text-xs text-[#806135] leading-relaxed mb-3">O caminho costeiro acima depende de canoa e maré. O mapa automático pode usar outro trajeto; seus quilômetros não substituem essa referência.</p><WalkingPanel home={home} tour={tour}/></details> : <WalkingPanel home={home} tour={tour}/>)}
      {active==='transit' && <button onClick={()=>onSwitchToRoute(tour.title)} className="flex items-center justify-center gap-2 min-h-[46px] bg-[#263f35] text-white rounded-xl font-bold text-sm">Consultar linhas cadastradas <ArrowUpRight size={16}/></button>}
    </div>
  </section>;
}
