import React,{useEffect,useState} from "react";
import PlaceLocationPicker from "./PlaceLocationPicker";
import InternalPlaceSearch,{PlaceDuplicateNotice} from "./InternalPlaceSearch";
import {experiencePublication,experiencePhotoUrl} from "../lib/liveExperiencePublication";
import {EXPERIENCE_CATEGORIES,STATES,placeDraft,localToday,validateExperienceDraft} from "../lib/experienceFormModel.js";
import {internalPlaceSearch} from "../lib/internalPlaceSearch";
import "./ExperienceForm.css";

function PhotoSlot({photo,index,cover,onChange,onCover,disabled,urlFor}){
 const [preview,setPreview]=useState('');
 useEffect(()=>{
  if(photo?.file){const url=URL.createObjectURL(photo.file);setPreview(url);return()=>URL.revokeObjectURL(url);}
  setPreview(photo?.storage_path?urlFor(photo.storage_path):'');
 },[photo,urlFor]);
 return <div className="rr-experience-photo">
  {preview&&<img src={preview} alt={`Prévia da foto ${index+1}`}/>}
  <label>Foto {index+1}<input type="file" accept="image/*,.heic,.heif" disabled={disabled} onChange={e=>{const file=e.target.files?.[0];if(file)onChange({file,caption:photo?.caption||''});}}/></label>
  <label className="rr-cover-choice"><input type="radio" name="experience-cover" value={index} checked={cover===index} disabled={disabled} onChange={()=>onCover(index)}/> Usar foto {index+1} como capa</label>
 </div>;
}
function Coordinates({place,selected,update}){
 return <div className="form-pair"><label>Latitude<input type="number" step="any" min={-90} max={90} required value={place.lat} readOnly={!!selected&&selected.lat!=null} onChange={e=>update('lat',e.target.value)}/></label>
  <label>Longitude<input type="number" step="any" min={-180} max={180} required value={place.lng} readOnly={!!selected&&selected.lng!=null} onChange={e=>update('lng',e.target.value)}/></label></div>;
}
export default function ExperienceForm({user,initial=null,onSaved=()=>{},onLockChange=()=>{},service=experiencePublication,searchApi,urlFor=experiencePhotoUrl}){
 const [id]=useState(()=>initial?.id||crypto.randomUUID());
 const legacy=!!initial?.id&&initial.schema_version!==2;
 const [selected,setSelected]=useState(null),[manual,setManual]=useState(false),[name,setName]=useState(initial?.name||'');
 const [place,setPlace]=useState(()=>placeDraft(initial||{})),[locationMode,setLocationMode]=useState('address');
 const [note,setNote]=useState(initial?.note||''),[visitedOn,setVisitedOn]=useState(initial?.visited_on||'');
 const [photos,setPhotos]=useState([null,null]),[cover,setCover]=useState(null);
 const [how,setHow]=useState(initial?.how_to_get||{}),[tips,setTips]=useState(initial?.tips||'');
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
 async function submit(e){
  e.preventDefault();if(busy||loading)return;setBusy(true);setError('');onLockChange(true);let keepLocked=false;
  try{
   let result;
   if(pending)result=await service.retry(id);
   else{
    const data={id,version,legacy,placeId:selected?.requires_completion?null:selected?.id||null,placeVersion:selected?.version,placeData:{...place,name:manual?name:place.name,...(selected?.requires_completion?{legacy_source_id:selected.id}: {})},
      visitedOn,note,photos,coverIndex:cover,howToGet:how,tips,needsConfirmation};
    if(!legacy&&!selected&&!manual)throw new Error('Pesquise e escolha o lugar antes de continuar.');
    validateExperienceDraft(data);result=await service.save(data);
   }
   setPending(false);await onSaved(result);
  }catch(err){setError(err.message);setPending(!!err.pending);keepLocked=!!err.pending;}finally{setBusy(false);onLockChange(keepLocked);}
 }
 if(loading)return <p role="status">Carregando sua experiência…</p>;
 return <form className="compact-form rr-experience-form" onSubmit={submit}>
  <p className="field-help">Você compartilha como <b>{user?.user_metadata?.full_name||user?.user_metadata?.name||'Viajante'}</b>.</p>
  {legacy?<div className="rr-experience-place-summary"><strong>{initial.name}</strong><span>{initial.address} · {initial.city}</span><p>Suas fotos e informações anteriores serão mantidas.</p></div>:
   <InternalPlaceSearch label="Pesquisar lugar" value={name} disabled={locked} api={searchApi}
    onChange={text=>{setName(text);setSelected(null);setManual(false);}}
    onSelect={selectPlace} onCreate={(text,destination)=>{setName(text);setManual(true);setSelected(null);setPlace({...placeDraft(initial?.id?{}:initial||{}),name:text,municipality:destination?.municipality||placeDraft(initial||{}).municipality||'',state:destination?.state||placeDraft(initial||{}).state||'',destination_id:destination?.id||'',destination_name:destination?.name||''});setLocationMode('address');}}/>}
  {!legacy&&(selected||manual)&&<fieldset disabled={locked} className="rr-experience-fields">
   <legend>{selected?'Dados do lugar':'Cadastrar novo lugar'}</legend>
   {selected&&<p className="field-help">{selected.requires_completion?"Confira o endereço ou referência. Município e UF podem ser completados depois.":"Os dados compartilhados estão protegidos. Complete apenas o que estiver faltando."}</p>}
   {manual&&<PlaceLocationPicker disabled={locked} api={searchApi||internalPlaceSearch} onSelect={selectPlace} onConfirm={location=>{setPlace(p=>({...p,...location}));setLocationMode(location.address?'address':'point');}}/>}
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
  {(legacy||selected||manual)&&<fieldset disabled={locked} className="rr-experience-fields">
   <legend>Sua experiência</legend>
   {!legacy&&<label>Data da visita<input type="date" required max={localToday()} value={visitedOn} onChange={e=>setVisitedOn(e.target.value)}/></label>}
   <label>Relato da experiência<textarea required maxLength={500} rows={4} value={note} onChange={e=>setNote(e.target.value)}/><small>{note.length}/500 caracteres</small></label>
   {!legacy&&<><p className="field-help">Duas fotos da sua visita. Escolha uma delas como capa.</p><div className="rr-experience-photos">{[0,1].map(index=><PhotoSlot key={index} index={index} photo={photos[index]} cover={cover} disabled={locked} urlFor={urlFor} onCover={setCover} onChange={photo=>setPhotos(current=>current.map((item,i)=>i===index?photo:item))}/>)}</div></>}
   <details className="rr-experience-optional"><summary>Como chegar <small>opcional</small></summary>
    <label>Ponto de partida<input maxLength={160} value={how.starting_point||''} onChange={e=>setHow(h=>({...h,starting_point:e.target.value}))}/></label>
    <label>Transporte<input maxLength={120} placeholder="Canoa e caminhada, por exemplo" value={how.transport||''} onChange={e=>setHow(h=>({...h,transport:e.target.value}))}/></label>
    <label>Trajeto<textarea maxLength={600} rows={3} value={how.route||''} onChange={e=>setHow(h=>({...h,route:e.target.value}))}/></label>
   </details>
   <label>Dicas adicionais <small>opcional</small><textarea maxLength={500} rows={2} value={tips} onChange={e=>setTips(e.target.value)}/></label>
  </fieldset>}
  {error&&<p role="alert" className="form-error">{error}</p>}
  {(legacy||selected||manual)&&<button type="submit" className="primary-action" disabled={busy||loading}>{busy?'Salvando…':pending?'Conferir envio':initial?.id?'Salvar alterações':'Publicar experiência'}</button>}
 </form>;
}
