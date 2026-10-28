import { jsPDF } from 'jspdf';
import { validateItinerary,orderedLegs,legTiming,durationLabel,TRANSPORTS,displayLocal } from './itinerary.js';
const clean=v=>String(v).replace(/→/g,' para ').replace(/[\u2010-\u2015]/g,'-').replace(/[^\x20-\x7e\xa1-\xff\n]/gu,'');
export function createItineraryPdf(plan) {
  validateItinerary(plan);
  const doc=new jsPDF({unit:'mm',format:'a4',compress:true});let y=25;
  const green='#243E32',muted='#596458',terra='#A64425';
  function newPage(){doc.addPage();y=24;}
  function text(value,size=11,color=green,bold=false){doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(color);const lines=doc.splitTextToSize(clean(value),172);for(const line of lines){if(y>273)newPage();doc.text(line,19,y);y+=size*.48+1;}y+=2;}
  function heading(value){if(y>220)newPage();y+=6;text(value,17,green,true);}
  doc.setFillColor('#F6F1E8');doc.rect(0,0,210,297,'F');
  text('ROTA RAIZ / CADERNO DE VIAGEM',10,terra,true);y+=8;text(plan.title,28,green,true);
  const visited=plan.visits.filter(v=>v.visited),planned=plan.visits.filter(v=>!v.visited);
  text(`${plan.legs.length} ${plan.legs.length===1?"trecho":"trechos"} | ${visited.length} ${visited.length===1?"lugar visitado":"lugares visitados"} | ${planned.length} para conhecer`,11,muted);y+=6;
  text('O caminho também é viagem.',15,green,true);
  text('Seu registro pessoal de deslocamentos, visitas e descobertas. Planejamento e experiências realizadas aparecem separados.',11,muted);
  heading('O caminho em trechos');
  if(!plan.legs.length)text('Nenhum trecho registrado.',11,muted);
  for(const [i,leg] of orderedLegs(plan).entries()) {
    const timing=legTiming(leg);if(y>224)newPage();
    text(`${String(i+1).padStart(2,'0')} / ${TRANSPORTS[leg.mode]} - ${leg.status==='done'?'Realizado':'Planejado'}`,13,terra,true);
    text(`${leg.segments[0].from} → ${leg.segments.at(-1).to}`,16,green,true);
    text(`${durationLabel(timing.total)} no total | ${timing.stops} ${timing.stops===1?"parada":"paradas"}${leg.company?' | '+leg.company:''}`,10,muted);
    for(const [n,s] of leg.segments.entries()) {
      if(y>247)newPage();
      // A schematic line is an illustration of the sequence, not a navigable map.
      doc.setDrawColor(green);doc.setLineWidth(.5);doc.line(19,y,187,y);doc.setFillColor(green);doc.circle(19,y,1.2,'F');doc.circle(187,y,1.2,'F');
      if(leg.mode==='flight'){doc.setDrawColor(terra);doc.setFillColor(terra);doc.lines([[2.5,0],[1,-3],[1.5,0],[-.5,3],[4.5,.8],[0,.4],[-4.5,.8],[.5,3],[-1.5,0],[-1,-3],[-2.5,0],[-1,1],[0,-4],[1,1]],96,y-1,[1,1],'F',true);}
      y+=8;text(`${s.from} → ${s.to}`,11,green,true);
      text(`Saída: ${displayLocal(s.departure)} (${s.fromZone})`,10,muted);
      text(`Chegada: ${displayLocal(s.arrival)} (${s.toZone})`,10,muted);
      if(n<timing.waits.length)text(`Parada em ${s.to}: ${durationLabel(timing.waits[n])} até a próxima saída de ${leg.segments[n+1].from}.`,10,terra);
    }
    if(leg.comment)text(leg.comment,11,muted);y+=4;
  }
  for(const [title,visits] of [['Por onde passei',visited],['Ainda quero conhecer',planned]]) {
    heading(title);if(!visits.length)text('Nenhum lugar registrado nesta seção.',11,muted);
    for(const visit of [...visits].sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'))) {
      if(y>249)newPage();text(visit.title,14,green,true);text(`${visit.location}${visit.date?' | '+visit.date.split('-').reverse().join('/'):''}`,10,muted);if(visit.comment)text(visit.comment,11,muted);y+=3;
    }
  }
  for(let i=1;i<=doc.getNumberOfPages();i++){doc.setPage(i);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(muted);doc.text('Rota Raiz | Roteiro pessoal. Linhas ilustram a sequência dos trechos.',19,288);doc.text(`${i} / ${doc.getNumberOfPages()}`,190,288,{align:'right'});}
  doc.setProperties({title:clean(plan.title),author:'Rota Raiz',subject:'Trechos e experiências de viagem'});return doc;
}
export function downloadItineraryPdf(plan){const name=plan.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'viagem';createItineraryPdf(plan).save(`rota-raiz-roteiro-${name}.pdf`);}
