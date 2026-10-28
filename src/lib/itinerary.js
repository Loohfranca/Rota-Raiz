export const TRANSPORTS = { flight: 'Avião', bus: 'Ônibus', car: 'Carro / táxi', boat: 'Barco / canoa', walk: 'A pé', bike: 'Bicicleta', other: 'Outro' };
export const ZONES = ['America/Sao_Paulo','America/Bahia','America/Fortaleza','America/Manaus','America/Rio_Branco','America/Noronha','UTC','Europe/Lisbon','Europe/London','Europe/Paris','America/New_York'];
const requireText = (value, max, label) => { if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`Confira ${label}.`); };
const optionalText = (value, max) => { if (typeof value !== 'string' || value.length > max) throw new Error('Texto muito longo ou inválido.'); };
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value+'T12:00:00Z');
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0,10) === value;
}
function partsAt(stamp, formatter) {
  const values = Object.fromEntries(formatter.formatToParts(new Date(stamp)).map(p => [p.type,p.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}
// Match a wall-clock time against actual zone offsets, including DST transitions.
// Ambiguous and nonexistent local times require correction rather than a guessed instant.
export function localInstant(local, zone) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) || !validDate(local.slice(0,10)) || +local.slice(11,13)>23 || +local.slice(14)>59) throw new Error('Confira a data e o horário completos.');
  if(typeof zone!=='string'||!zone.trim()) throw new Error('Informe o fuso do horário.');
  let formatter;
  try { formatter = new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}); } catch { throw new Error('Fuso inválido. Use um nome como America/Sao_Paulo.'); }
  const wall = Date.parse(local+':00Z'), offsets = new Set();
  for (let h=-48;h<=48;h+=6) { const sample=wall+h*3600000; offsets.add(Date.parse(partsAt(sample,formatter)+':00Z')-sample); }
  const candidates=[...offsets].map(offset=>wall-offset).filter(stamp=>partsAt(stamp,formatter)===local);
  if (candidates.length!==1) throw new Error(candidates.length ? 'Horário ambíguo pela mudança de fuso. Informe esse horário em UTC para diferenciá-lo.' : 'Esse horário não existe nesse fuso. Confira o bilhete.');
  return candidates[0];
}
export function legTiming(leg) {
  if (!leg || !Object.hasOwn(TRANSPORTS,leg.mode) || !Array.isArray(leg.segments) || leg.segments.length<1 || leg.segments.length>8) throw new Error('Informe de um a oito percursos por trecho.');
  const rides=[], waits=[];
  for(const segment of leg.segments) {
    requireText(segment.from,160,'a origem'); requireText(segment.to,160,'o destino');
    if(segment.from.trim().toLocaleLowerCase()===segment.to.trim().toLocaleLowerCase()) throw new Error('Origem e destino precisam ser diferentes.');
    const start=localInstant(segment.departure,segment.fromZone), end=localInstant(segment.arrival,segment.toZone);
    if(end<=start) throw new Error('A chegada precisa ser depois da saída. Confira as datas e os fusos.');
    if(rides.length) { const wait=start-rides.at(-1).end; if(wait<0) throw new Error('A próxima saída está antes da chegada da conexão.'); waits.push(wait/60000); }
    rides.push({start,end,minutes:(end-start)/60000});
  }
  return { rides, waits, stops:waits.length, total:(rides.at(-1).end-rides[0].start)/60000, first:rides[0].start };
}
export function durationLabel(minutes) { const rounded=Math.round(minutes); const hours=Math.floor(rounded/60), rest=rounded%60; return hours ? `${hours}h${rest ? ` ${rest}min` : ''}` : `${rest}min`; }
export function validateItinerary(plan) {
  requireText(plan.id,100,'a viagem'); requireText(plan.title,100,'o nome da viagem');
  if(!Array.isArray(plan.legs)||!Array.isArray(plan.visits)||plan.legs.length>200||plan.visits.length>500) throw new Error('Limite de trechos ou lugares excedido.');
  for(const list of [plan.legs,plan.visits]) { if(new Set(list.map(i=>i.id)).size!==list.length) throw new Error('Registros duplicados.'); }
  for(const leg of plan.legs) { requireText(leg.id,100,'o trecho'); legTiming(leg); optionalText(leg.company,120); optionalText(leg.comment,1000); if(!['planned','done'].includes(leg.status)) throw new Error('Estado do trecho inválido.'); }
  for(const visit of plan.visits) { requireText(visit.id,100,'o lugar'); requireText(visit.placeId,150,'o lugar'); requireText(visit.title,160,'o nome do lugar'); optionalText(visit.location,300); optionalText(visit.address,500); optionalText(visit.comment,1000); if(typeof visit.visited!=='boolean'||typeof visit.date!=='string'||(visit.date&&!validDate(visit.date))) throw new Error('Confira a data da visita.'); }
  return plan;
}
export function placeVisit(place) {
  const visit={id:crypto.randomUUID(),placeId:String(place.id),title:place.title,location:place.location||'',address:place.address||`${place.title}, ${place.location||''}`,visited:false,date:'',comment:''};
  if(Number.isFinite(place.lat)&&Number.isFinite(place.lng)) { visit.lat=place.lat;visit.lng=place.lng; }
  return visit;
}
export function orderedLegs(plan) { return [...plan.legs].sort((a,b)=>legTiming(a).first-legTiming(b).first); }
export function displayLocal(value) { return `${value.slice(8,10)}/${value.slice(5,7)}/${value.slice(0,4)} · ${value.slice(11,16)}`; }
