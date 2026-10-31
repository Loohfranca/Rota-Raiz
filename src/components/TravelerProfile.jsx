import React,{useCallback,useEffect,useState} from "react";
import {ArrowLeft,Camera,Heart,MapPin,Plus,Trash2,Pencil,Check,ExternalLink,UserRound,ImagePlus,Compass,ChevronRight,ChevronLeft,X} from "lucide-react";
import * as liveApi from "../lib/travelerProfiles";
import ExperienceForm from "./ExperienceForm";
import Sheet from "./Sheet";
import {experiencePublication} from "../lib/liveExperiencePublication";
export default function TravelerProfile({viewer,profileId,onBack,onOpenRecommendation,onOpenCommunity,profileApi=liveApi,publicationService,placeSearch,photoUrlFor}){
 const api=profileApi;
 const own=viewer?.id===profileId;
 const [profile,setProfile]=useState(null),[cities,setCities]=useState([]),[photos,setPhotos]=useState([]),[recommendations,setRecommendations]=useState([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [editing,setEditing]=useState(false),[draft,setDraft]=useState({display_name:"",bio:"",instagram:""});
 const [composer,setComposer]=useState(null);
 const [composerLocked,setComposerLocked]=useState(false);
 const [selectedPhoto,setSelectedPhoto]=useState(null);
 const [expandedExperience,setExpandedExperience]=useState(null),[showExperiences,setShowExperiences]=useState(false);
 const refresh=useCallback(async()=>{
   if(!profileId)return;setError("");setLoading(true);
   try{
    if(own)await api.ensureProfile();
    const [p,c,images,places]=await Promise.all([api.getProfile(profileId),api.getProfileCities(profileId),api.getCityPhotos(profileId),api.getTravelerRecommendations(profileId)]);
    setProfile(p);setDraft({display_name:p?.display_name||"",bio:p?.bio||"",instagram:p?.instagram||""});const canonical=places.filter(item=>item.schema_version===2).map(item=>({id:'experience-'+item.id,experience_id:item.id,canonical:true,publication:item,place_name:item.name,city:item.city,state:''}));
    setCities([...c.filter(item=>!canonical.some(exp=>exp.experience_id===item.experience_id)),...canonical]);
    setPhotos(images.map(photo=>photo.experience_id?{...photo,city_id:'experience-'+photo.experience_id,canonical:true}:photo));setRecommendations(places);
   }catch(e){setError(e.message);}finally{setLoading(false);}
 },[profileId,own,api]);
 useEffect(()=>{refresh();},[refresh]);
 async function execute(action,success){if(busy)return;setBusy(true);setError("");setNotice("");try{await action();await refresh();setNotice(success);}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function like(photo){if(busy)return;setBusy(true);try{await api.togglePhotoLike(photo.id,photo.liked,viewer.id);setPhotos(all=>all.map(p=>p.id===photo.id?{...p,liked:!p.liked,likes:p.likes+(p.liked?-1:1)}:p));}catch(e){setError(e.message);}finally{setBusy(false);}}
 function navigatePhoto(offset){
  if(!selectedPhoto)return;
  const gallery=photos.filter(photo=>photo.city_id===selectedPhoto.cityId);
  const i=gallery.findIndex(photo=>photo.id===selectedPhoto.photoId);
  if(i<0||!gallery.length)return;
  setSelectedPhoto({...selectedPhoto,photoId:gallery[(i+offset+gallery.length)%gallery.length].id});
 }
 useEffect(()=>{
  if(!selectedPhoto)return;
  function keydown(e){if(e.key==="Escape")setSelectedPhoto(null);else if(e.key==="ArrowLeft")navigatePhoto(-1);else if(e.key==="ArrowRight")navigatePhoto(1);}
  document.addEventListener("keydown",keydown);
  return()=>document.removeEventListener("keydown",keydown);
 },[selectedPhoto,photos]);
 const count=photos.length;
 return <section className="rr-profile-page">
  <div className="rr-profile-back"><button className="small-action" onClick={onBack}><ArrowLeft size={17}/> Voltar</button><span className="eyebrow">PERFIL DO VIAJANTE</span></div>
  {loading&&!profile?<p role="status">Carregando perfil…</p>:null}
  {error&&<p className="form-error" role="alert">{error}</p>}
  {notice&&<p className="rr-admin-success" role="status"><Check size={16}/>{notice}</p>}
  {!loading&&!profile?<div className="quiet-empty"><UserRound size={28}/><h2>Viajante ainda sem perfil configurado</h2><p>O perfil estará disponível quando a pessoa acessar a nova versão.</p></div>:profile&&<>
   <header className="rr-profile-hero">
    <div className="rr-profile-hero-inner">
     <div className="rr-profile-avatar-wrap">
      {profile.avatar_url?<img className="rr-profile-avatar" src={profile.avatar_url} alt={"Foto de "+profile.display_name}/>:<span className="rr-profile-avatar rr-profile-avatar-empty"><UserRound size={42}/></span>}
      {own&&<label className="rr-profile-avatar-edit" title="Escolher foto da galeria"><Camera size={17}/><input type="file" accept="image/*,.heic,.heif" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)execute(async()=>{await api.uploadAvatar(viewer.id,file,profile.avatar_url);},"Foto de perfil atualizada.");e.target.value="";}}/></label>}
     </div>
     <div className="rr-profile-title"><h1>{profile.display_name}</h1><p>{profile.bio||"Explorando caminhos e colecionando memórias."}</p>
      {profile.instagram&&<a href={"https://instagram.com/"+profile.instagram} target="_blank" rel="noopener noreferrer">Instagram: @{profile.instagram} <ExternalLink size={13}/></a>}
     </div>
     {own&&<button className="small-action rr-profile-edit" onClick={()=>setEditing(v=>!v)}><Pencil size={16}/> {editing?"Fechar":"Editar perfil"}</button>}
    </div>
    <div className="rr-profile-numbers"><span><b>{cities.length}</b> experiências</span><span><b>{count}</b> fotos</span><span><b>{recommendations.length}</b> indicações</span><span><Heart size={14}/> {photos.reduce((a,p)=>a+p.likes,0)} curtidas</span></div>
   </header>
   {own&&editing&&<form className="rr-profile-editor" onSubmit={e=>{e.preventDefault();execute(async()=>{await api.saveProfile(viewer.id,draft);setEditing(false);},"Perfil atualizado.");}}>
    <label>Seu nome público<input required minLength={2} maxLength={60} value={draft.display_name} onChange={e=>setDraft({...draft,display_name:e.target.value})}/></label>
    <label>Sobre você<textarea maxLength={240} rows={3} placeholder="Uma frase sobre suas viagens…" value={draft.bio} onChange={e=>setDraft({...draft,bio:e.target.value})}/></label>
    <label>Instagram (opcional)<input maxLength={30} placeholder="@usuario" value={draft.instagram} onChange={e=>setDraft({...draft,instagram:e.target.value})}/></label>
    <button className="primary-action" disabled={busy}><Check size={17}/> Salvar perfil</button>
   </form>}
   <div className="rr-profile-section-title"><div><span className="eyebrow">MEMÓRIAS DE VIAGEM</span><h2>Experiências</h2><p>Momentos e lugares que marcaram o caminho.</p></div>{own&&<button type="button" className="rr-profile-plus" onClick={()=>setComposer({})} title="Cadastrar experiência" aria-label="Cadastrar experiência" aria-expanded={!!composer}><Plus size={20}/></button>}</div>
   {own&&composer&&<Sheet title={composer.id?"Editar experiência":"Compartilhe uma experiência"} onClose={()=>{if(!composerLocked)setComposer(null);}}><ExperienceForm user={viewer} initial={composer.id?composer:null} service={publicationService} searchApi={placeSearch} urlFor={photoUrlFor} onLockChange={setComposerLocked} onSaved={async published=>{setComposer(null);await refresh();setNotice(published.status==='approved'&&!published.deleted_at?"Experiência salva e compartilhada na Comunidade.":"Experiência salva para revisão.");}}/></Sheet>}
   {own&&<button type="button" className="small-action rr-profile-upload-trigger" onClick={()=>setComposer({})}><ImagePlus size={17}/>Adicionar fotos</button>}
   {photos.length===0?<div className="rr-profile-empty"><MapPin size={26}/><p>{own?"Seu álbum está vazio. Compartilhe uma experiência com suas duas fotos.":"Este viajante ainda não publicou fotos."}</p></div>:
     <div className="rr-profile-flat-grid" aria-label="Galeria de fotos do viajante">
       {photos.map(photo=>{
         const city=cities.find(c=>c.id===photo.city_id);
         const label=city?.place_name||city?.city||"Lugar";
         return <button key={photo.id} type="button" className="rr-profile-flat-tile" onClick={()=>setSelectedPhoto({cityId:photo.city_id,photoId:photo.id})} aria-label={"Abrir foto de "+label}>
           <img src={photo.url} alt={photo.caption||"Foto de "+label} loading="lazy"/>
           <span className="rr-profile-flat-location"><MapPin size={12}/>{label}</span>
         </button>;
       })}
     </div>}
   <div className="rr-profile-experiences-controls">
     <button type="button" className="rr-profile-experience-toggle" onClick={()=>setShowExperiences(v=>!v)} aria-expanded={showExperiences}>
       <span><MapPin size={17}/> Ver lugares visitados <small>({cities.length})</small></span><ChevronRight size={18} className={showExperiences?"rr-rotated":""}/>
     </button>
     {showExperiences&&<div className="rr-profile-experiences-list">
       {cities.length===0?<p>Nenhum lugar compartilhado ainda.</p>:cities.map(place=>{
         const placePhotos=photos.filter(p=>p.city_id===place.id);
         const related=place.canonical?recommendations.filter(r=>r.id===place.experience_id):recommendations.filter(r=>
           [r.name,r.city].some(v=>v&&v.toLocaleLowerCase("pt-BR").includes((place.place_name||place.city).toLocaleLowerCase("pt-BR")))||
           (r.city&&r.city.toLocaleLowerCase("pt-BR")===place.city.toLocaleLowerCase("pt-BR")));
         const isOpen=expandedExperience===place.id;
         return <div className="rr-profile-experience-row" key={place.id}>
           <button type="button" className="rr-profile-experience-row-button" onClick={()=>setExpandedExperience(isOpen?null:place.id)} aria-expanded={isOpen}>
             <span><strong>{place.place_name||place.city}</strong><small>{place.city}{place.state?", "+place.state:""} · {placePhotos.length} foto{placePhotos.length===1?"":"s"}</small></span>
             <ChevronRight size={17} className={isOpen?"rr-rotated":""}/>
           </button>
           {own&&place.canonical&&<><button type="button" className="small-action" onClick={()=>setComposer(place.publication)}><Pencil size={15}/>Editar experiência</button><button type="button" className="small-action" disabled={busy} onClick={()=>{if(window.confirm("Remover esta experiência? Seu histórico será preservado."))execute(()=>(publicationService||experiencePublication).setDeleted(place.publication,true),"Experiência removida.");}}><Trash2 size={15}/>Excluir experiência</button></>}
           {isOpen&&<div className="rr-profile-experience-details">
             {placePhotos.length>0?<div className="rr-profile-experience-miniatures">{placePhotos.map(photo=><button key={photo.id} type="button" onClick={()=>setSelectedPhoto({cityId:place.id,photoId:photo.id})}><img src={photo.url} alt={photo.caption||place.place_name||place.city} loading="lazy"/></button>)}</div>:<p>Nenhuma foto publicada neste lugar.</p>}
             {related.length>0?<><strong className="rr-profile-experience-related-title">Indicações relacionadas</strong>{related.map(r=><button key={r.id} type="button" className="rr-profile-experience-related" onClick={()=>onOpenRecommendation?.(r.id)}>{r.name}<ChevronRight size={15}/></button>)}</>:<p>Sem indicações relacionadas a este lugar.</p>}
           </div>}
         </div>;
       })}
     </div>}
   </div>
   {selectedPhoto&&(()=>{
     const city=cities.find(c=>c.id===selectedPhoto.cityId);
     const gallery=photos.filter(p=>p.city_id===selectedPhoto.cityId);
     const idx=gallery.findIndex(p=>p.id===selectedPhoto.photoId);
     const photo=gallery[idx];
     if(!photo)return null;
     return <div className="rr-profile-lightbox-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedPhoto(null);}}>
       <section role="dialog" aria-modal="true" aria-label={"Galeria de "+(city?.place_name||city?.city||"experiência")} className="rr-profile-lightbox">
         <div className="rr-profile-lightbox-head"><strong><MapPin size={16}/>{city?.place_name||city?.city}{city?.city&&city.place_name!==city.city?", "+city.city:""}</strong><button type="button" className="rr-profile-lightbox-close" onClick={()=>setSelectedPhoto(null)} aria-label="Fechar foto"><X size={20}/></button></div>
         <div className="rr-profile-lightbox-photo">
           <img src={photo.url} alt={photo.caption||"Foto de "+(city?.place_name||city?.city)}/>
           {gallery.length>1&&<>
             <button type="button" className="rr-profile-gallery-arrow prev" aria-label="Foto anterior" onClick={()=>navigatePhoto(-1)}><ChevronLeft size={22}/></button>
             <button type="button" className="rr-profile-gallery-arrow next" aria-label="Próxima foto" onClick={()=>navigatePhoto(1)}><ChevronRight size={22}/></button>
             <span className="rr-profile-gallery-count">{idx+1}/{gallery.length}</span>
           </>}
         </div>
         <div className="rr-profile-lightbox-actions">
           {!photo.canonical&&<button type="button" aria-label={photo.liked?"Descurtir foto":"Curtir foto"} aria-pressed={photo.liked} disabled={busy} onClick={()=>like(photo)}><Heart size={21} fill={photo.liked?"currentColor":"none"}/>{photo.likes} curtidas</button>}
           {photo.caption&&<p>{photo.caption}</p>}
           {own&&!photo.canonical&&<button type="button" disabled={busy} className="rr-profile-lightbox-trash" onClick={()=>{if(window.confirm("Excluir esta foto?"))execute(()=>api.deleteProfilePhoto(photo),"Foto excluída.");setSelectedPhoto(null);}} aria-label="Excluir foto"><Trash2 size={19}/></button>}
         </div>
       </section>
     </div>;
   })()}
   <div className="rr-profile-section-title rr-profile-recommendation-heading">
      <div><span className="eyebrow">DICAS PARA OUTROS VIAJANTES</span><h2>Indicações</h2><p>Os lugares que {own?"você compartilhou":"este viajante compartilhou"} na Comunidade.</p></div>
      {own&&<button type="button" className="small-action" onClick={()=>setComposer({})}><Plus size={16}/> Indicar lugar</button>}
   </div>
   {recommendations.length>0?
     <div className="rr-profile-recommendations">{recommendations.map(place=>
       <button type="button" className="rr-profile-recommendation" key={place.id} onClick={()=>onOpenRecommendation?.(place.id)}>
         {place.image_url?<img src={place.image_url} alt="" loading="lazy"/>:<span className="rr-profile-recommendation-icon"><MapPin size={23}/></span>}
         <span className="rr-profile-recommendation-text">
           <small>{place.category==="Comida"?"Alimentação":place.category} · {place.city}</small>
           <strong>{place.name}</strong>
           <span>{place.note}</span>
         </span>
         <ChevronRight size={18} aria-hidden="true"/>
       </button>)}</div>
     :<div className="rr-profile-empty"><Compass size={26}/><p>{own?"Você ainda não indicou nenhum lugar. Compartilhe sua primeira dica na Comunidade.":"Este viajante ainda não publicou indicações."}</p>{own&&<button type="button" className="small-action" onClick={onOpenCommunity}>Ir à Comunidade</button>}</div>}
   {own&&<p className="rr-profile-limits">Novas experiências têm duas fotos e uma capa. Os limites de armazenamento da sua conta continuam valendo. Comentários ficam nas experiências da Comunidade.</p>}
  </>}
 </section>;
}
