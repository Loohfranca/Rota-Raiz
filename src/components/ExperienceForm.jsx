import {MapPin, Camera, PenLine, Eye, Check, ImagePlus, ArrowRight, UserRound} from "lucide-react";
import React,{useEffect,useRef,useState} from "react";
import PlaceLocationPicker from "./PlaceLocationPicker";
import InternalPlaceSearch,{PlaceDuplicateNotice} from "./InternalPlaceSearch";
import {experiencePublication,experiencePhotoUrl} from "../lib/liveExperiencePublication";
import {EXPERIENCE_CATEGORIES,STATES,placeDraft,localToday,validateExperienceDraft} from "../lib/experienceFormModel.js";
import {internalPlaceSearch} from "../lib/internalPlaceSearch";
import "./ExperienceForm.css";

const memoryDrafts=new Map();
const steps=[["Lugar",MapPin],["Fotos",Camera],["Relato",PenLine],["Prévia",Eye]];
const successMessages=["Uma descoberta a mais no mapa.","Sua dica já pode inspirar outra viagem.","Mais um lugar ganhou uma história.","Uma boa memória virou dica.","Mais uma parada para descobrir.","Sua história agora faz parte do caminho.","Seu relato já está na comunidade.","Uma nova perspectiva sobre esse lugar.","Mais uma dica para a próxima viagem.","Sua experiência ficou registrada.","Uma descoberta compartilhada vale por duas.","Seu relato ajuda quem vai depois.","Mais um lugar para guardar na memória.","A comunidade ganhou uma nova dica.","Sua história já pode ser encontrada.","Um pedaço da sua viagem ficou aqui.","Seu olhar sobre o lugar agora está no mapa.","Uma nova história para quem adora explorar.","Mais uma experiência para compartilhar.","Sua dica já está disponível para outros viajantes."];
function loadDraft(key){
 if(!key)return null;
 if(memoryDrafts.has(key))return memoryDrafts.get(key);
 try{return JSON.parse(sessionStorage.getItem(key)||"null");}catch{return null;}
}
function CoverPreview({photo}){
 const [src,setSrc]=useState("");
 useEffect(()=>{
  if(!photo?.file)return;
  const url=URL.createObjectURL(photo.file);setSrc(url);
  return()=>URL.revokeObjectURL(url);
 },[photo]);
 return src?<img src={src} alt="Capa da indicação"/>:null;
}
function PhotoSlot({photo,index,cover,onChange,onCover,disabled,urlFor}){
 const [preview,setPreview]=useState('');
 useEffect(()=>{
  if(photo?.file){const url=URL.createObjectURL(photo.file);setPreview(url);return()=>URL.revokeObjectURL(url);}
  setPreview(photo?.storage_path?urlFor(photo.storage_path):'');
 },[photo,urlFor]);
 return <div className="rr-experience-photo">
  <label className="rr-photo-picker">
   {preview?<img src={preview} alt={`Prévia da foto ${index+1}`}/>:<ImagePlus size={28} aria-hidden="true"/>}
   <span>{preview?`Trocar foto ${index+1}`:`Adicionar foto ${index+1}`}</span>
   <input aria-label={`Foto ${index+1}`} type="file" accept="image/*,.heic,.heif" disabled={disabled} onChange={e=>{const file=e.target.files?.[0];if(file)onChange({file,caption:photo?.caption||''});}}/>
  </label>
  <label className="rr-cover-choice"><input type="radio" name="experience-cover" value={index} checked={cover===index} disabled={disabled} onChange={()=>onCover(index)}/> Usar foto {index+1} como capa</label>
 </div>;
}
function Coordinates({place,selected,update}){
 return <div className="form-pair"><label>Latitude<input type="number" step="any" min={-90} max={90} required value={place.lat} readOnly={!!selected&&selected.lat!=null} onChange={e=>update('lat',e.target.value)}/></label>
  <label>Longitude<input type="number" step="any" min={-180} max={180} required value={place.lng} readOnly={!!selected&&selected.lng!=null} onChange={e=>update('lng',e.target.value)}/></label></div>;
}
export default function ExperienceForm({guided=false,user,initial=null,onSaved=()=>{},onLockChange=()=>{},service=experiencePublication,searchApi,urlFor=experiencePhotoUrl}){
 const wizard=guided&&!initial;
 const draftKey=wizard&&user?.id?`rr_publication_draft:${user.id}`:null;
 const [draft]=useState(()=>loadDraft(draftKey));
 const [step,setStep]=useState(0);
 const heading=useRef(null);
 const [id]=useState(()=>initial?.id||draft?.id||crypto.randomUUID());
 const legacy=!!initial?.id&&initial.schema_version!==2;
 const [selected,setSelected]=useState(draft?.selected||null),[manual,setManual]=useState(!!draft?.manual),[name,setName]=useState(initial?.name||draft?.name||'');
 const [place,setPlace]=useState(()=>draft?.place||placeDraft(initial||{})),[locationMode,setLocationMode]=useState(draft?.locationMode||'address');
 const [note,setNote]=useState(initial?.note||draft?.note||''),[visitedOn,setVisitedOn]=useState(initial?.visited_on||draft?.visitedOn||'');
 const [photos,setPhotos]=useState(draft?.photos||[null,null]),[cover,setCover]=useState(draft?.cover??null);
 const [how,setHow]=useState(initial?.how_to_get||draft?.how||{}),[tips,setTips]=useState(initial?.tips||draft?.tips||'');
 useEffect(()=>{
  if(!draftKey||(!selected&&!manual&&!name&&!note))return;
  const data={id,selected,manual,name,place,locationMode,note,visitedOn,how,tips};
  memoryDrafts.set(draftKey,{...data,photos,cover});
  try{sessionStorage.setItem(draftKey,JSON.stringify(data));}catch{}
 },[draftKey,id,selected,manual,name,place,locationMode,note,visitedOn,how,tips,photos,cover]);
 const [version,setVersion]=useState(initial?.version??null);
 const [loading,setLoading]=useState(!!initial?.id&&!legacy),[busy,setBusy]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState('');
 function selectPlace(full){setSelected(full);setPlace(placeDraft(full));setName(full.name||full.title);setManual(false);setLocationMode(full.address?'address':'point');}
 useEffect(()=>{
  if(!initial?.id||legacy)return;let current=true;
  (async()=>{
   try{
    const row=await service.get(initial.id);if(!row)throw new Error('Esta experiência não está disponível para edição.');
    const full=row.place||await (searchApi||internalPlaceSearch).getPlace(row.place_id);
    if(!current)return;selectPlace(full);setVersion(row.version);setNote(row.note);setVisitedOn(row.visited_on);
    setHow(row.how_to_get||{});setTips(row.tips||'');setPhotos(row.photos||[null,null]);setCover(row.photos?.findIndex(photo=>photo.is_cover)??null);
   }catch(e){if(current)setError(e.message);}finally{if(current)setLoading(false);}
  })();return()=>{current=false;};
 },[initial?.id,legacy,service,searchApi]);
 const locked=busy||pending||loading;
 const missing=selected?.missing_fields||[];
 const editable=field=>!selected||missing.includes(field)||!placeDraft(selected)[field];
 const needsConfirmation=false;
 const update=(field,value)=>setPlace(p=>({...p,[field]:value}));
 function goStep(next){
  setError("");setStep(next);
  window.requestAnimationFrame?.(()=>heading.current?.focus());
 }
 function advance(form){
  if(step===0&&!selected&&!manual){setError("Selecione ou cadastre o lugar para continuar.");return;}
  if(step===1&&(!photos.every(photo=>photo?.file)||![0,1].includes(cover))){
   setError("Escolha duas fotos e marque uma como capa.");return;
  }
  if(step===2&&!note.trim()){setError("Conte um pouco da sua experiência.");return;}
  const panel=form.querySelector("[data-step]:not([hidden])");
  for(const field of panel?.querySelectorAll("input,select,textarea")||[]){
   if(!field.reportValidity())return;
  }
  goStep(step+1);
 }
 async function submit(e){
  e.preventDefault();if(busy||loading)return;if(wizard&&step<3&&!pending){advance(e.currentTarget);return;}setBusy(true);setError('');onLockChange(true);let keepLocked=false;
  try{
   let result;
   if(pending)result=await service.retry(id);
   else{
    const data={id,version,legacy,placeId:selected?.requires_completion?null:selected?.id||null,placeVersion:selected?.version,placeData:{...place,name:manual?name:place.name,...(selected?.requires_completion?{legacy_source_id:selected.id}: {})},
      visitedOn,note,photos,coverIndex:cover,howToGet:how,tips,needsConfirmation};
    if(!legacy&&!selected&&!manual)throw new Error('Pesquise e escolha o lugar antes de continuar.');
    validateExperienceDraft(data);result=await service.save(data);
   }
   if(draftKey){memoryDrafts.delete(draftKey);try{sessionStorage.removeItem(draftKey);}catch{}}
   setPending(false);
   await onSaved(result,wizard&&result.status==="approved"&&!result.deleted_at?successMessages[Math.floor(Math.random()*successMessages.length)]:null);
  }catch(err){setError(err.message);setPending(!!err.pending);keepLocked=!!err.pending;}finally{setBusy(false);onLockChange(keepLocked);}
 }
 if(loading)return <p role="status">Carregando sua experiência…</p>;
 return <form className="compact-form rr-experience-form" onSubmit={submit} noValidate={wizard}>
  <p className="rr-publish-author"><UserRound size={15} aria-hidden="true"/> Publicando como <b>{user?.user_metadata?.full_name||user?.user_metadata?.name||'Viajante'}</b></p>
  {wizard&&<div className="rr-publish-progress">
   <ol aria-label="Etapas da publicação">{steps.map(([label,Icon],i)=><li key={label} aria-current={i===step?"step":undefined} data-complete={i<step}><span>{i<step?<Check size={18} aria-hidden="true"/>:<Icon size={18} aria-hidden="true"/>}</span>{label}</li>)}</ol>
   <h3 tabIndex={-1} ref={heading}>{["Escolha o lugar","Mostre o que você viu","Conte como foi","Revise antes de publicar"][step]}</h3>
   {draft&&step===0&&<p className="field-help">Seu rascunho foi recuperado.{!photos.some(Boolean)&&" Se já havia escolhido fotos, selecione-as novamente."}</p>}
  </div>}
  <div className="rr-publish-stage" data-step="place" hidden={wizard&&step!==0}>
  {!initial?.id&&!selected&&<section className="rr-discovery-start" aria-label="Comece pela localização">
   {!wizard&&<h3>Onde fica a sua descoberta?</h3>}
   <PlaceLocationPicker disabled={locked} api={searchApi||internalPlaceSearch} onSelect={selectPlace} onConfirm={location=>{setPlace(p=>({...p,...location}));setManual(true);setLocationMode(location.address?'address':'point');}}/>
   <p className="rr-location-alternative"><span>ou encontre pelo nome</span></p>
  </section>}
  {legacy?<div className="rr-experience-place-summary"><strong>{initial.name}</strong><span>{initial.address} · {initial.city}</span><p>Suas fotos e informações anteriores serão mantidas.</p></div>:
   <InternalPlaceSearch label="Pesquisar lugar" value={name} disabled={locked} api={searchApi}
    onChange={text=>{setName(text);setSelected(null);setManual(false);}}
    onSelect={selectPlace} onCreate={(text,destination)=>{setName(text);setManual(true);setSelected(null);setPlace({...placeDraft(initial?.id?{}:initial||{}),name:text,municipality:destination?.municipality||placeDraft(initial||{}).municipality||'',state:destination?.state||placeDraft(initial||{}).state||'',destination_id:destination?.id||'',destination_name:destination?.name||''});setLocationMode('address');}}/>}
  {!legacy&&(selected||manual)&&<fieldset disabled={locked} className="rr-experience-fields">
   <legend>{selected?'Lugar selecionado':'2. Complete os dados do lugar'}</legend>
   {selected&&<p className="field-help">{selected.requires_completion?"Confira o endereço ou referência. Município e UF podem ser completados depois.":"Os dados compartilhados estão protegidos. Complete apenas o que estiver faltando."}</p>}
   {manual&&place.lat!==''&&place.lng!==''&&<p className="rr-place-coordinates">Ponto do lugar: {Number(place.lat).toFixed(6)}, {Number(place.lng).toFixed(6)}</p>}
   <label>Nome do lugar<input required minLength={2} maxLength={120} value={place.name} readOnly={!editable('name')} onChange={e=>{update('name',e.target.value);if(manual)setName(e.target.value);}}/></label>
   <label>Categoria<select required value={place.category} disabled={!editable('category')} onChange={e=>update('category',e.target.value)}><option value="">Selecione</option>{EXPERIENCE_CATEGORIES.map(c=><option key={c} value={c}>{c==='Comida'?'Alimentação':c}</option>)}</select></label>
   <div className="form-pair"><label>Cidade<input required={!selected?.requires_completion} minLength={2} maxLength={120} readOnly={!editable('municipality')} value={place.municipality} onChange={e=>update('municipality',e.target.value)}/></label>
    <label>Estado<select required={!selected?.requires_completion} value={place.state} disabled={!editable('state')} onChange={e=>update('state',e.target.value)}><option value="">UF</option>{STATES.map(uf=><option key={uf}>{uf}</option>)}</select></label></div>
   {!selected&&<label>Destino ou região <small>opcional</small><input maxLength={120} value={place.destination_name} readOnly={!!place.destination_id} placeholder="Ilha de Boipeba, por exemplo" onChange={e=>update('destination_name',e.target.value)}/></label>}
   {(!selected||(editable('address')&&(selected.lat==null||selected.lng==null)))&&<label>Localização<select value={locationMode} onChange={e=>{setLocationMode(e.target.value);update('address','');}}><option value="address">Endereço postal</option><option value="point">Ponto geográfico</option></select></label>}
   {locationMode==='address'?<><label>Endereço<input required maxLength={300} readOnly={!editable('address')} value={place.address} onChange={e=>update('address',e.target.value)} placeholder="Rua, número e bairro, quando houver"/></label>
     {selected&&((selected.lat==null)!==(selected.lng==null))&&<Coordinates place={place} selected={selected} update={update}/>}</>:
    <><p className="field-help">Praias e atrações sem endereço podem usar coordenadas. Não é necessário inventar rua ou número.</p><Coordinates place={place} selected={selected} update={update}/>
     <label>Referência da localização<input required maxLength={300} value={place.location_reference} readOnly={!editable('location_reference')} placeholder="Entrada da praia, vila ou ponto conhecido" onChange={e=>update('location_reference',e.target.value)}/></label></>}
   <label>Instagram <small>opcional{selected?.instagram?' · já cadastrado':''}</small><input maxLength={120} value={place.instagram} readOnly={!!selected?.instagram} placeholder="@nomedolugar" onChange={e=>update('instagram',e.target.value)}/></label>
   {(manual||selected?.requires_completion)&&<PlaceDuplicateNotice name={place.name} address={place.address} city={place.municipality} state={place.state} onSelect={selectPlace} api={searchApi}/>}
  </fieldset>}
  </div>
  {(legacy||selected||manual)&&<fieldset className="rr-experience-fields rr-publish-stage" disabled={locked} data-step="photos" hidden={wizard&&step!==1}>
   {!legacy&&<legend>Fotos e capa</legend>}
   {!legacy&&<><p className="field-help">Duas fotos da sua visita. Escolha uma delas como capa.</p><div className="rr-experience-photos">{[0,1].map(index=><PhotoSlot key={index} index={index} photo={photos[index]} cover={cover} disabled={locked} urlFor={urlFor} onCover={setCover} onChange={photo=>setPhotos(current=>current.map((item,i)=>i===index?photo:item))}/>)}</div></>}
  </fieldset>}
  {(legacy||selected||manual)&&<fieldset data-step="story" hidden={wizard&&step!==2} disabled={locked} className="rr-experience-fields rr-publish-stage">
   <legend>Sua experiência</legend>
   {!legacy&&<label>Data da visita<input type="date" required max={localToday()} value={visitedOn} onChange={e=>setVisitedOn(e.target.value)}/></label>}
   <label>Relato da experiência<textarea required maxLength={500} rows={4} value={note} onChange={e=>setNote(e.target.value)}/><small>{note.length}/500 caracteres</small></label>

   <details className="rr-experience-optional"><summary>Como chegar <small>opcional</small></summary>
    <label>Ponto de partida<input maxLength={160} value={how.starting_point||''} onChange={e=>setHow(h=>({...h,starting_point:e.target.value}))}/></label>
    <label>Transporte<input maxLength={120} placeholder="Canoa e caminhada, por exemplo" value={how.transport||''} onChange={e=>setHow(h=>({...h,transport:e.target.value}))}/></label>
    <label>Trajeto<textarea maxLength={600} rows={3} value={how.route||''} onChange={e=>setHow(h=>({...h,route:e.target.value}))}/></label>
   </details>
   <label>Dicas adicionais <small>opcional</small><textarea maxLength={500} rows={2} value={tips} onChange={e=>setTips(e.target.value)}/></label>
  </fieldset>}
  {wizard&&step===3&&<section className="rr-publish-stage rr-publish-preview" aria-label="Prévia da indicação">
   <div className="rr-publish-cover"><CoverPreview photo={photos[cover]}/><span><Camera size={14}/> Foto de capa</span></div>
   <h4>{place.name||name}</h4>
   <p>{[place.municipality,place.state].filter(Boolean).join(", ")} · {visitedOn.split("-").reverse().join("/")}</p>
   {note.length>180?<><p>{note.slice(0,180)}…</p><details><summary>Ler mais</summary><p>{note}</p></details></>:<p>{note}</p>}
   {Object.values(how).some(Boolean)&&<details><summary>Como chegar</summary>{Object.values(how).filter(Boolean).map((line,i)=><p key={i}>{line}</p>)}</details>}
   {tips&&<p>{tips}</p>}
  </section>}
  {busy&&<p role="status" aria-live="polite">Salvando sua experiência…</p>}
  {error&&<p role="alert" className="form-error">{error}</p>}
  {(wizard||legacy||selected||manual)&&<div className="rr-publish-actions">
   {wizard&&step>0&&!pending&&<button type="button" className="small-action" disabled={locked} onClick={()=>goStep(step-1)}>Voltar</button>}
   <button type="submit" className="primary-action" disabled={busy||loading}>{busy?'Salvando…':pending?'Conferir envio':wizard&&step<3?'Continuar':initial?.id?'Salvar alterações':'Publicar experiência'}{wizard&&step<3&&<ArrowRight size={17} aria-hidden="true"/>}</button>
  </div>}
 </form>;
}
