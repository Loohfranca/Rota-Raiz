import React,{lazy,Suspense,useEffect,useRef,useState} from 'react';
import {currentPosition,reverseSuggestion} from '../lib/placeLocation.js';
import {reversePlacePoint} from '../lib/geocode.js';
import {internalPlaceSearch} from '../lib/internalPlaceSearch';
import {STATES} from '../lib/experienceFormModel.js';
const Map=lazy(()=>import('./PlaceLocationMap'));
export default function PlaceLocationPicker({disabled,onConfirm,onSelect,api=internalPlaceSearch,locate=currentPosition,reverse=reversePlacePoint,MapComponent=Map}){
 const [point,setPoint]=useState(null),[accuracy,setAccuracy]=useState(null),[fields,setFields]=useState(null),[nearby,setNearby]=useState([]),[busy,setBusy]=useState(''),[error,setError]=useState(''),[resultsUnavailable,setResultsUnavailable]=useState(false);
 const revision=useRef(0),controller=useRef(null);
 useEffect(()=>{if(disabled){revision.current++;controller.current?.abort();setBusy('');}},[disabled]);
 useEffect(()=>()=>{revision.current++;controller.current?.abort();},[]);
 function move(p){if(disabled)return;revision.current++;controller.current?.abort();setPoint(p);setFields(null);setNearby([]);setBusy('');setError('');}
 async function gps(){const token=++revision.current;setBusy('gps');setError('');try{const p=await locate();if(token!==revision.current)return;setAccuracy(p.accuracy);move({lat:p.lat,lng:p.lng});}catch(e){if(token===revision.current)setError(e.message);}finally{if(token===revision.current)setBusy('');}}
 async function review(){const token=++revision.current;controller.current?.abort();const abort=new AbortController();controller.current=abort;setBusy('review');setError('');setFields(null);setNearby([]);
  const results=await Promise.allSettled([reverse(point,AbortSignal.any([abort.signal,AbortSignal.timeout(15000)])),api.nearby(point,AbortSignal.any([abort.signal,AbortSignal.timeout(15000)]))]);
  if(token!==revision.current)return;
  setFields(results[0].status==='fulfilled'?reverseSuggestion(results[0].value):{municipality:'',state:'',address:'',location_reference:''});
  setResultsUnavailable(results[1].status==='rejected');setNearby(results[1].status==='fulfilled'?results[1].value:[]);
  setError(results.filter(r=>r.status==='rejected').map(r=>r.reason?.message||'Consulta indisponível. Preencha manualmente.').join(' '));setBusy('');
 }
 async function choose(id){const token=++revision.current;setBusy('select');setError('');try{const place=await api.getPlace(id);if(!place)throw new Error("Este lugar não está mais disponível.");if(token===revision.current){onSelect(place);setPoint(null);}}catch(e){if(token===revision.current)setError(e.message);}finally{if(token===revision.current)setBusy('');}}
 const valid=fields&&fields.municipality.trim().length>=2&&STATES.includes(fields.state)&&(fields.address.trim()||fields.location_reference.trim());
 return <section className="rr-place-location" aria-label="Localização do lugar">
  <button type="button" disabled={disabled||!!busy} onClick={gps}>Usar minha localização atual</button>
  <p className="field-help">O GPS localiza o ponto, não identifica o estabelecimento. Mapa e consulta de endereço enviam o ponto aos respectivos provedores. Você confirma antes de associá-lo ao lugar.</p>
  {busy&&<p role="status">{busy==='gps'?'Obtendo GPS…':'Consultando localização…'}</p>}
  {error&&<p role="alert">{error}</p>}
  {point&&<><p className="field-help">Arraste o mapa ou o marcador para corrigir o ponto. Você também pode clicar no mapa ou usar as setas do teclado.</p>
   {Number.isFinite(accuracy)&&<small>Precisão informada pelo GPS: cerca de {Math.round(accuracy)} m.</small>}
   <Suspense fallback={<p>Carregando mapa…</p>}><MapComponent point={point} onChange={move} disabled={disabled}/></Suspense>
   <p className="rr-place-coordinates">Ponto escolhido: {point.lat.toFixed(6)}, {point.lng.toFixed(6)}</p>
   <button type="button" disabled={disabled||!!busy} onClick={review}>Conferir este ponto</button>
   {fields&&<><p className="field-help">Sugestão do mapa: confira município, estado e endereço. Sem rua ou número? Use uma referência geográfica.</p>
    {['municipality','state','address','location_reference'].map((key,index)=><label key={key}>{['Município do ponto','Estado do ponto','Endereço sugerido','Referência geográfica'][index]}
     {key==='state'?<select disabled={disabled||!!busy} value={fields[key]} onChange={e=>{setFields({...fields,[key]:e.target.value});}}><option value="">UF</option>{STATES.map(uf=><option key={uf}>{uf}</option>)}</select>:
      <input disabled={disabled||!!busy} value={fields[key]} maxLength={key==='municipality'?120:300} onChange={e=>{setFields({...fields,[key]:e.target.value});}}/>}</label>)}
    <strong>Lugares próximos no Rota Raiz</strong><p className="field-help">Até 1,5 km. Proximidade não significa que seja o mesmo lugar.</p>
    {nearby.length?nearby.map(p=><button className="rr-nearby-place" type="button" key={p.id} disabled={disabled||!!busy} onClick={()=>choose(p.id)}>{p.name} · {p.category} · {p.municipality}/{p.state} · {Math.round(p.distance_m)} m</button>):<p>{resultsUnavailable ? "Não foi possível consultar os lugares próximos. Use a pesquisa por nome acima." : "Nenhum lugar próximo encontrado nesta consulta. A pesquisa por nome continua disponível acima."}</p>}
    <button className="primary-action" type="button" disabled={disabled||!!busy||!valid} onClick={()=>{onConfirm({...fields,...point});setPoint(null);setFields(null);}}>Confirmar localização do novo lugar</button>
   </>}
   <small className="field-help">Endereços: Photon / dados © OpenStreetMap.</small>
   <button type="button" disabled={disabled} onClick={()=>{revision.current++;controller.current?.abort();setPoint(null);setFields(null);setBusy('');setError('');}}>Cancelar e preencher manualmente</button>
  </>}
 </section>;
}
