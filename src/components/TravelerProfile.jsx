import React,{useCallback,useEffect,useState} from "react";
import {ArrowLeft,Camera,Heart,MapPin,Plus,Trash2,Pencil,Check,ExternalLink,UserRound,ImagePlus,Compass,ChevronRight,ChevronLeft,X} from "lucide-react";
import * as api from "../lib/travelerProfiles";
import DestinationPhotoPicker from "./DestinationPhotoPicker";
export default function TravelerProfile({viewer,profileId,onBack,onOpenRecommendation,onOpenCommunity}){
 const own=viewer?.id===profileId;
 const [profile,setProfile]=useState(null),[cities,setCities]=useState([]),[photos,setPhotos]=useState([]),[recommendations,setRecommendations]=useState([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [editing,setEditing]=useState(false),[draft,setDraft]=useState({display_name:"",bio:"",instagram:""});
 const [addingCity,setAddingCity]=useState(false),[cityName,setCityName]=useState(""),[stateName,setStateName]=useState("");
 const [selectedPhoto,setSelectedPhoto]=useState(null);
 const [uploadOpen,setUploadOpen]=useState(false),[uploadCityId,setUploadCityId]=useState("");
 const refresh=useCallback(async()=>{
   if(!profileId)return;setError("");setLoading(true);
   try{
    if(own)await api.ensureProfile();
    const [p,c,images,places]=await Promise.all([api.getProfile(profileId),api.getProfileCities(profileId),api.getCityPhotos(profileId),api.getTravelerRecommendations(profileId)]);
    setProfile(p);setDraft({display_name:p?.display_name||"",bio:p?.bio||"",instagram:p?.instagram||""});setCities(c);setPhotos(images);setRecommendations(places);
   }catch(e){setError(e.message);}finally{setLoading(false);}
 },[profileId,own]);
 useEffect(()=>{refresh();},[refresh]);
 async function execute(action,success){if(busy)return;setBusy(true);setError("");setNotice("");try{await action();await refresh();setNotice(success);}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function like(photo){if(busy)return;setBusy(true);try{await api.togglePhotoLike(photo.id,photo.liked,viewer.id);setPhotos(all=>all.map(p=>p.id===photo.id?{...p,liked:!p.liked,likes:p.likes+(p.liked?-1:1)}:p));}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function publishCityPhotos(city,files,caption){
  if(busy||files.length<1||files.length>2)return false;
  const existing=photos.filter(photo=>photo.city_id===city.id).length;
  if(existing+files.length>2||photos.length+files.length>25){
   setError("Limite de 2 fotos por destino ou 25 fotos por perfil. Exclua uma foto antes de publicar outra.");
   return false;
  }
  setBusy(true);setError("");setNotice("");
  const uploaded=[];
  try{
   for(const file of files){uploaded.push(await api.uploadProfilePhoto(viewer.id,city.id,file,caption));}
   await refresh();
   setNotice(files.length===1?"Foto publicada em "+city.city+".":"As duas fotos foram publicadas em "+city.city+".");
   return true;
  }catch(e){
   for(const photo of uploaded){try{await api.deleteProfilePhoto(photo);}catch{/* may require manual cleanup on poor connection */}}
   await refresh();
   setError("Não foi possível publicar as fotos: "+e.message);
   return false;
  }finally{setBusy(false);}
 }
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
    <div className="rr-profile-numbers"><span><b>{cities.length}</b> cidades</span><span><b>{count}</b> fotos</span><span><b>{recommendations.length}</b> indicações</span><span><Heart size={14}/> {photos.reduce((a,p)=>a+p.likes,0)} curtidas</span></div>
   </header>
   {own&&editing&&<form className="rr-profile-editor" onSubmit={e=>{e.preventDefault();execute(async()=>{await api.saveProfile(viewer.id,draft);setEditing(false);},"Perfil atualizado.");}}>
    <label>Seu nome público<input required minLength={2} maxLength={60} value={draft.display_name} onChange={e=>setDraft({...draft,display_name:e.target.value})}/></label>
    <label>Sobre você<textarea maxLength={240} rows={3} placeholder="Uma frase sobre suas viagens…" value={draft.bio} onChange={e=>setDraft({...draft,bio:e.target.value})}/></label>
    <label>Instagram (opcional)<input maxLength={30} placeholder="@usuario" value={draft.instagram} onChange={e=>setDraft({...draft,instagram:e.target.value})}/></label>
    <button className="primary-action" disabled={busy}><Check size={17}/> Salvar perfil</button>
   </form>}
   <div className="rr-profile-section-title"><div><span className="eyebrow">ÁLBUM DE VIAGENS</span><h2>Fotos de viagem</h2><p>Todas as fotos em um só lugar. Toque para ampliar.</p></div>{own&&<button type="button" className="rr-profile-plus" onClick={()=>setAddingCity(v=>!v)} title="Cadastrar destino para publicação" aria-label="Cadastrar destino para publicação" aria-expanded={addingCity}><Plus size={20}/></button>}</div>
   {own&&addingCity&&<form className="rr-profile-city-form" onSubmit={e=>{e.preventDefault();execute(()=>api.addProfileCity(viewer.id,cityName,stateName),"Destino adicionado.");setCityName("");setStateName("");setAddingCity(false);}}>
    <label>Cidade<input required maxLength={100} value={cityName} onChange={e=>setCityName(e.target.value)} placeholder="Salvador"/></label>
    <label>Estado<input maxLength={60} value={stateName} onChange={e=>setStateName(e.target.value)} placeholder="Bahia"/></label>
    <button className="primary-action" disabled={busy}>Adicionar destino</button>
   </form>}
}
   {own&&<div className="rr-profile-upload-area">
     <button type="button" className="small-action rr-profile-upload-trigger" onClick={()=>setUploadOpen(v=>!v)} aria-expanded={uploadOpen}>
       <ImagePlus size={17}/> {uploadOpen?"Fechar publicação":"Adicionar fotos"}
     </button>
     {uploadOpen&&<div className="rr-profile-upload-panel">
       <label className="rr-profile-upload-destination">Local das fotos
         <select value={uploadCityId} onChange={e=>setUploadCityId(e.target.value)}>
           <option value="">Selecione um destino</option>
           {cities.map(city=>{
             const used=photos.filter(photo=>photo.city_id===city.id).length;
             return <option key={city.id} value={city.id} disabled={used>=2}>{city.city}{city.state?", "+city.state:""} · {used}/2 fotos</option>;
           })}
         </select>
       </label>
       <p className="rr-profile-upload-hint">O destino identifica as fotos e controla o limite de 2 por lugar. Todas aparecem juntas no perfil.</p>
       {uploadCityId&&(()=>{
         const city=cities.find(c=>c.id===uploadCityId);
         if(!city)return null;
         const remaining=Math.min(2-photos.filter(photo=>photo.city_id===city.id).length,25-count);
         return remaining>0?<DestinationPhotoPicker key={city.id} city={city.city} remaining={remaining} busy={busy} onPublish={(files,caption)=>publishCityPhotos(city,files,caption).then(ok=>{if(ok){setUploadOpen(false);setUploadCityId("");}return ok;})}/>:<p className="rr-profile-upload-hint">Este destino já atingiu o limite. Selecione outro ou exclua uma foto.</p>;
       })()}
       {!cities.length&&<p className="rr-profile-upload-hint">Cadastre o primeiro destino no botão + acima para publicar fotos.</p>}
     </div>}
   </div>}
   {photos.length===0?<div className="rr-profile-empty"><MapPin size={26}/><p>{own?"Seu álbum está vazio. Cadastre um destino e adicione até duas fotos dele.":"Este viajante ainda não publicou fotos."}</p></div>:
     <div className="rr-profile-flat-grid" aria-label="Galeria de fotos do viajante">
       {photos.map(photo=>{
         const city=cities.find(c=>c.id===photo.city_id);
         const label=city?.city||"Destino";
         return <button key={photo.id} type="button" className="rr-profile-flat-tile" onClick={()=>setSelectedPhoto({cityId:photo.city_id,photoId:photo.id})} aria-label={"Abrir foto de "+label}>
           <img src={photo.url} alt={photo.caption||"Foto de "+label} loading="lazy"/>
           <span className="rr-profile-flat-location"><MapPin size={12}/>{label}</span>
         </button>;
       })}
     </div>}
   {selectedPhoto&&(()=>{
     const city=cities.find(c=>c.id===selectedPhoto.cityId);
     const gallery=photos.filter(p=>p.city_id===selectedPhoto.cityId);
     const idx=gallery.findIndex(p=>p.id===selectedPhoto.photoId);
     const photo=gallery[idx];
     if(!photo)return null;
     return <div className="rr-profile-lightbox-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedPhoto(null);}}>
       <section role="dialog" aria-modal="true" aria-label={"Galeria de "+(city?.city||"destino")} className="rr-profile-lightbox">
         <div className="rr-profile-lightbox-head"><strong><MapPin size={16}/>{city?.city}{city?.state?", "+city.state:""}</strong><button type="button" className="rr-profile-lightbox-close" onClick={()=>setSelectedPhoto(null)} aria-label="Fechar foto"><X size={20}/></button></div>
         <div className="rr-profile-lightbox-photo">
           <img src={photo.url} alt={photo.caption||"Foto de "+city?.city}/>
           {gallery.length>1&&<>
             <button type="button" className="rr-profile-gallery-arrow prev" aria-label="Foto anterior" onClick={()=>navigatePhoto(-1)}><ChevronLeft size={22}/></button>
             <button type="button" className="rr-profile-gallery-arrow next" aria-label="Próxima foto" onClick={()=>navigatePhoto(1)}><ChevronRight size={22}/></button>
             <span className="rr-profile-gallery-count">{idx+1}/{gallery.length}</span>
           </>}
         </div>
         <div className="rr-profile-lightbox-actions">
           <button type="button" aria-label={photo.liked?"Descurtir foto":"Curtir foto"} aria-pressed={photo.liked} disabled={busy} onClick={()=>like(photo)}><Heart size={21} fill={photo.liked?"currentColor":"none"}/>{photo.likes} curtidas</button>
           {photo.caption&&<p>{photo.caption}</p>}
           {own&&<button type="button" disabled={busy} className="rr-profile-lightbox-trash" onClick={()=>{if(window.confirm("Excluir esta foto?"))execute(()=>api.deleteProfilePhoto(photo),"Foto excluída.");setSelectedPhoto(null);}} aria-label="Excluir foto"><Trash2 size={19}/></button>}
         </div>
       </section>
     </div>;
   })()}
   <div className="rr-profile-section-title rr-profile-recommendation-heading">
      <div><span className="eyebrow">DICAS PARA OUTROS VIAJANTES</span><h2>Indicações</h2><p>Os lugares que {own?"você compartilhou":"este viajante compartilhou"} na Comunidade.</p></div>
      {own&&<button type="button" className="small-action" onClick={onOpenCommunity}><Plus size={16}/> Indicar lugar</button>}
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
   {own&&<p className="rr-profile-limits">Você pode compartilhar até 2 fotos por destino e 25 fotos de viagem no total, além da foto de perfil. Fotos públicas recebem apenas curtidas; comentários ficam nas indicações da Comunidade.</p>}
  </>}
 </section>;
}
