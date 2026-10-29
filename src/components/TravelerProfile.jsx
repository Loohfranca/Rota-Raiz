import React,{useCallback,useEffect,useState} from "react";
import {ArrowLeft,Camera,Heart,MapPin,Plus,Trash2,Pencil,Check,ExternalLink,UserRound,ImagePlus,Compass,ChevronRight} from "lucide-react";
import * as api from "../lib/travelerProfiles";
export default function TravelerProfile({viewer,profileId,onBack,onOpenRecommendation,onOpenCommunity}){
 const own=viewer?.id===profileId;
 const [profile,setProfile]=useState(null),[cities,setCities]=useState([]),[photos,setPhotos]=useState([]),[recommendations,setRecommendations]=useState([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [editing,setEditing]=useState(false),[draft,setDraft]=useState({display_name:"",bio:"",instagram:""});
 const [addingCity,setAddingCity]=useState(false),[cityName,setCityName]=useState(""),[stateName,setStateName]=useState("");
 const [selectedCity,setSelectedCity]=useState(null),[caption,setCaption]=useState("");
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
   <div className="rr-profile-section-title"><div><span className="eyebrow">ÁLBUM DE VIAGENS</span><h2>Destinos visitados</h2><p>As cidades e as fotos que o viajante compartilhou.</p></div>{own&&<button type="button" className="rr-profile-plus" onClick={()=>setAddingCity(v=>!v)} title="Adicionar destino" aria-label="Adicionar destino" aria-expanded={addingCity}><Plus size={20}/></button>}</div>
   {own&&addingCity&&<form className="rr-profile-city-form" onSubmit={e=>{e.preventDefault();execute(()=>api.addProfileCity(viewer.id,cityName,stateName),"Destino adicionado.");setCityName("");setStateName("");setAddingCity(false);}}>
    <label>Cidade<input required maxLength={100} value={cityName} onChange={e=>setCityName(e.target.value)} placeholder="Salvador"/></label>
    <label>Estado<input maxLength={60} value={stateName} onChange={e=>setStateName(e.target.value)} placeholder="Bahia"/></label>
    <button className="primary-action" disabled={busy}>Adicionar destino</button>
   </form>}
   {!cities.length&&<div className="rr-profile-empty"><MapPin size={28}/><p>{own?"Adicione a primeira cidade que você visitou. Ela aparecerá neste perfil.":"Este viajante ainda não compartilhou cidades."}</p></div>}
   <div className="rr-profile-cities">
   {cities.map(city=>{
     const gallery=photos.filter(photo=>photo.city_id===city.id);
     return <article className="rr-profile-city" key={city.id}>
       <div className="rr-profile-city-cover">{gallery[0]?.url?<img src={gallery[0].url} alt={city.city} loading="lazy"/>:<div className="rr-profile-city-placeholder"><MapPin size={30}/></div>}</div>
       <div className="rr-profile-city-info"><div><h3>{city.city}</h3><p>{city.state||"Brasil"} · {gallery.length} de 2 fotos</p></div>
       {own&&<button className="rr-profile-trash" type="button" disabled={busy} aria-label={"Excluir "+city.city} title="Excluir cidade e suas fotos" onClick={()=>{if(window.confirm("Excluir esta cidade e suas fotos do seu perfil?"))execute(async()=>{for(const p of gallery)await api.deleteProfilePhoto(p);await api.deleteProfileCity(city.id);},"Cidade removida.");}}><Trash2 size={16}/></button>}</div>
       <div className="rr-profile-gallery">
        {gallery.map(photo=><div className="rr-profile-photo" key={photo.id}>
         <img src={photo.url} alt={photo.caption||"Foto de "+city.city} loading="lazy"/>
         <div className="rr-profile-photo-actions"><button type="button" aria-label={photo.liked?"Descurtir foto":"Curtir foto"} aria-pressed={photo.liked} disabled={busy} onClick={()=>like(photo)}><Heart size={16} fill={photo.liked?"currentColor":"none"}/> {photo.likes}</button>
         {own&&<button type="button" disabled={busy} onClick={()=>{if(window.confirm("Excluir esta foto?"))execute(()=>api.deleteProfilePhoto(photo),"Foto excluída.");}} aria-label="Excluir foto"><Trash2 size={15}/></button>}</div>
         {photo.caption&&<p>{photo.caption}</p>}
        </div>)}
       </div>
       {own&&gallery.length<2&&count<25&&<div className="rr-profile-photo-upload"><label className="rr-profile-add-photo"><ImagePlus size={17}/> Escolher da galeria<input type="file" disabled={busy} accept="image/*,.heic,.heif" onChange={e=>{const file=e.target.files?.[0];if(file)execute(()=>api.uploadProfilePhoto(viewer.id,city.id,file,caption),"Foto adicionada.");e.target.value="";}}/></label><input aria-label={"Legenda da próxima foto de "+city.city} maxLength={180} placeholder="Legenda opcional" value={selectedCity===city.id?caption:""} onFocus={()=>{if(selectedCity!==city.id){setSelectedCity(city.id);setCaption("");}}} onChange={e=>{setSelectedCity(city.id);setCaption(e.target.value);}}/></div>}
     </article>;
   })}
   </div>
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
