import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, MapPin, ArrowUpRight, Bookmark, ChevronRight, ChevronLeft, Image as ImageIcon, Trash2, Send, Pencil, Check, X, ShieldAlert } from "lucide-react";
import Sheet from "./Sheet";
import * as api from "../lib/community";

function Instagram({size=18}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" />
  </svg>;
}
export default function CommunityCard({ groupItems, openRequest, onOpenHandled, user, allStats, onRoute, onSavePlace, onViewExperiences, onRefresh, onError, onEdit, onDelete }) {
  const [activeIndex,setActiveIndex]=useState(0);
  const touchStart=React.useRef(null);
  const item=groupItems[activeIndex] || groupItems[0];
  const stats=allStats?.[item.id];
  const total=groupItems.length;
  function changeIndication(next) {
    setActiveIndex(index=>Math.min(total-1,Math.max(0,next)));
    setComments([]);
    setEditing(null);
    setCommentText("");
  }
  function startSwipe(e){touchStart.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}
  function endSwipe(e){
    if(!touchStart.current)return;
    const dx=e.changedTouches[0].clientX-touchStart.current.x;
    const dy=e.changedTouches[0].clientY-touchStart.current.y;
    if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.3)changeIndication(activeIndex+(dx<0?1:-1));
    touchStart.current=null;
  }
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    if(!openRequest)return;
    const index=groupItems.findIndex(entry=>entry.id===openRequest.id);
    if(index>=0){setActiveIndex(index);setOpen(true);onOpenHandled?.();}
  },[openRequest,groupItems,onOpenHandled]);
  const [liked,setLiked]=useState(false);
  const [likes,setLikes]=useState(0);
  const [count,setCount]=useState(0);
  const [comments,setComments]=useState([]);
  const [busy,setBusy]=useState(false);
  const [moderationNotice,setModerationNotice]=useState("");
  const [reported,setReported]=useState([]);
  const [commentText,setCommentText]=useState("");
  const [editing,setEditing]=useState(null);
  const [editText,setEditText]=useState("");
  const [imageFile,setImageFile]=useState(null);
  const [imageBusy,setImageBusy]=useState(false);
  const [saveBusy,setSaveBusy]=useState(false);
  const [saveNotice,setSaveNotice]=useState("");
  const [imageUrl,setImageUrl]=useState(item.image_url || "");
  useEffect(()=>{setLikes(stats?.likes||0);setCount(stats?.comments||0);setLiked(!!stats?.liked);},[stats]);
  useEffect(()=>{setImageUrl(item.image_url||"");},[item.image_url]);
  useEffect(()=>{
    if(!open)return;
    let current=true;setComments([]);
    api.getComments(item.id).then(result=>{if(current)setComments(result);}).catch(err=>{if(current)onError(err.message);});
    return()=>{current=false;};
  },[item.id,open,onError]);
  function openDetail() {setOpen(true);}
  async function toggleLike(e) {
    e?.stopPropagation();
    if(busy) return;
    setBusy(true);
    try {
      const next=await api.toggleLike(item.id,liked);
      setLiked(next); setLikes(n=>Math.max(0,n+(next?1:-1)));
    } catch(e){onError(e.message);} finally {setBusy(false);}
  }
  async function addComment(e) {
    e.preventDefault(); if(busy||!commentText.trim())return;
    setBusy(true);
    try {
      const added=await api.addComment(item.id,commentText);
      if(added?.moderated){setModerationNotice(added.reason==="ofensa_ou_ameaca"?"Este comentário não foi publicado por violar as regras da comunidade.":"Este comentário foi retido para revisão. O administrador poderá avaliar o contexto.");return;}
      setComments(cs=>[...cs,added]);setCount(n=>n+1);setCommentText("");setModerationNotice("");
    } catch(err){onError(err.message);} finally{setBusy(false);}
  }
  async function removeComment(c) {
    if(!window.confirm("Excluir este comentário?"))return;
    try {await api.deleteComment(c.id);setComments(cs=>cs.filter(x=>x.id!==c.id));setCount(n=>Math.max(0,n-1));}
    catch(err){onError(err.message);}
  }
  async function saveComment(c) {
    if(!editText.trim())return;
    try {const next=await api.editComment(c.id,editText);if(next?.moderated){setModerationNotice("Alteração não aplicada: o texto foi sinalizado e enviado à moderação.");setEditing(null);return;}setComments(cs=>cs.map(x=>x.id===c.id?next:x));setEditing(null);setEditText("");setModerationNotice("");}
    catch(err){onError(err.message);}
  }
  async function report(c){
    if(reported.includes(c.id))return;
    try {await api.reportComment(c.id);setReported(ids=>[...ids,c.id]);setModerationNotice("Denúncia enviada à administração para análise.");}
    catch(err){onError(err.message);}
  }
  async function uploadPhoto() {
    if(!imageFile || imageBusy)return;
    setImageBusy(true);
    try {
      const url=await api.uploadRecommendationPhoto(user,item.id,imageFile,imageUrl);
      setImageUrl(url);
      setImageFile(null);
      onRefresh();
    } catch(e){onError(e.message);}finally{setImageBusy(false);}
  }
  async function deletePhoto() {
    if(!window.confirm("Remover a fotografia da indicação?"))return;
    setImageBusy(true);
    try {await api.removeRecommendationPhoto(item.id,imageUrl);setImageUrl("");onRefresh();}
    catch(e){onError(e.message);}finally{setImageBusy(false);}
  }
  async function saveExperience(e) {
    e?.stopPropagation();
    if(!onSavePlace)return;
    setOpen(false);
    setSaveBusy(true);
    setSaveNotice("");
    try {
      const saved=await onSavePlace({id:"community-"+item.id,title:item.name,location:item.city,address:item.address});
      if(saved) setSaveNotice("Salvo nas suas Experiências!");
    } catch(err){onError(err.message);}
    finally{setSaveBusy(false);}
  }
  const mapsUrl="https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent([item.name,item.address,item.city].filter(Boolean).join(", "))+"&dir_action=navigate";
  const location=item.city?.split(",")[0]||"";
  const author=item.author_name||"Viajante";
  const insta=api.safeInstagram(item.instagram);
  const owner=!!user && item.user_id===user.id;
  const photo=imageUrl||"";
  return <>
    <article className="rr-social-card">
      <button type="button" className="rr-social-open" onClick={openDetail} aria-label={"Abrir detalhes de "+item.name}>
        <div className="rr-social-thumb">
          {photo ? <img src={photo} alt={"Fotografia de "+item.name} loading="lazy"/> : <ImageIcon size={29} aria-hidden="true"/>}
        </div>
        <div className="rr-social-content">
          <span className="rr-social-category">{item.category==="Comida"?"Alimentação":item.category} · {location}</span>
          <h3>{item.name}</h3>
          {total>1&&<span className="rr-social-multiple">{total} indicações deste lugar</span>}
          <p className="rr-social-summary">{item.note}</p>
          <span className="rr-social-location"><MapPin size={13}/>{item.address}</span>
        </div>
        <ChevronRight size={19} className="rr-social-chevron"/>
      </button>
      <div className="rr-social-bottom">
        <span className="rr-social-author"><span className="rr-social-author-icon">{item.editorial?"R":author[0]?.toUpperCase()}</span><span><b>{author}</b><small>{item.editorial?"sugestão editorial":"indicou este lugar"}</small></span></span>
        <button type="button" disabled={busy} onClick={toggleLike} aria-label={liked?"Descurtir":"Curtir"} aria-pressed={liked}><Heart size={18} fill={liked?"currentColor":"none"}/><span>{likes}</span></button>
        <button type="button" onClick={openDetail} aria-label={"Ver "+count+" comentários"}><MessageCircle size={18}/><span>{count}</span></button>
        {insta && <a href={insta} target="_blank" rel="noopener noreferrer" title="Instagram do lugar" aria-label={"Instagram de "+item.name}><Instagram size={18}/></a>}
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" aria-label={"Abrir Google Maps para "+item.name}><span className="rr-social-action-label">Como ir</span><ArrowUpRight size={17}/></a>
        <button type="button" className="rr-social-save" onClick={saveExperience} disabled={saveBusy} title="Salvar nas Experiências"><Bookmark size={16}/><span>{saveBusy?"Salvando…":saveNotice?"Salvo":"Salvar"}</span></button>
      </div>
      {saveNotice&&<div className="rr-social-save-notice" role="status"><Check size={17}/><span>{saveNotice}</span><button type="button" onClick={onViewExperiences}>Ver em Experiências <ArrowUpRight size={15}/></button></div>}
    </article>
    {open&&<Sheet title={item.name} onClose={()=>setOpen(false)}>
      <div className="rr-social-detail" onTouchStart={startSwipe} onTouchEnd={endSwipe}>
        {total>1&&<div className="rr-social-gallery-nav">
          <button type="button" disabled={activeIndex===0} onClick={()=>changeIndication(activeIndex-1)} aria-label="Indicação anterior"><ChevronLeft size={21}/></button>
          <span>Indicação {activeIndex+1} de {total} · deslize para ver outras experiências</span>
          <button type="button" disabled={activeIndex===total-1} onClick={()=>changeIndication(activeIndex+1)} aria-label="Próxima indicação"><ChevronRight size={21}/></button>
        </div>}
        {photo?<img className="rr-social-detail-photo" src={photo} alt={"Fotografia de "+item.name}/>:
          <div className="rr-social-detail-empty"><ImageIcon size={32}/><span>Sem foto ainda</span></div>}
        {item.photo_credit && item.photo_source_url && <a className="rr-social-source" href={item.photo_source_url} target="_blank" rel="noopener noreferrer" style={{fontSize:11}}>Foto: {item.photo_credit} <ArrowUpRight size={12}/></a>}
        <p className="rr-social-category">{item.category==="Comida"?"Alimentação":item.category} · {item.city}</p>
        <p className="rr-social-location"><MapPin size={15}/>{item.address}</p>
        <p className="rr-social-note">{item.note}</p>
        <p className="rr-social-attribution">{item.editorial?"Sugestão editorial da Equipe Rota Raiz":"Indicado por "+author}</p>
        {item.source_url&&<a className="rr-social-source" target="_blank" rel="noopener noreferrer" href={item.source_url}>Consultar referência do lugar <ArrowUpRight size={14}/></a>}
        <div className="rr-social-detail-actions">
          <button type="button" onClick={toggleLike} aria-pressed={liked} disabled={busy}><Heart size={17} fill={liked?"currentColor":"none"}/>{likes} curtidas</button>
          {insta&&<a href={insta} target="_blank" rel="noopener noreferrer"><Instagram size={17}/>Instagram</a>}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">Como ir <ArrowUpRight size={16}/></a>
          <button type="button" onClick={saveExperience}><Bookmark size={16}/>Salvar nas Experiências</button>
        </div>
        {owner&&<div className="rr-social-own-actions"><button type="button" onClick={()=>{setOpen(false);onEdit?.(item);}}><Pencil size={15}/>Editar indicação</button><button type="button" onClick={()=>{setOpen(false);onDelete?.(item);}}><Trash2 size={15}/>Excluir indicação</button></div>}
        {owner&&<div className="rr-social-upload">
          <b>Adicione uma foto</b>
          <label className="rr-social-upload-label">Escolher arquivo (JPG, PNG ou WebP, até 3 MB)
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setImageFile(e.target.files?.[0]||null)}/>
          </label>
          {imageFile&&<button type="button" disabled={imageBusy} onClick={uploadPhoto}>{imageBusy?"Enviando…":"Salvar foto"}</button>}
          {photo&&<button type="button" disabled={imageBusy} onClick={deletePhoto}><Trash2 size={15}/>Remover foto</button>}
        </div>}
        <div className="rr-social-comments">
          <h3>Comentários ({count})</h3>
          <p className="rr-community-rules">Respeite os viajantes: ofensas, xingamentos, ameaças e ataques pessoais são proibidos. Conteúdos ofensivos são bloqueados antes de aparecer, e mensagens ambíguas passam por revisão.</p>
          {moderationNotice&&<p className="rr-community-moderation-notice" role="status">{moderationNotice}</p>}
          {!comments.length&&<p className="rr-social-empty-comments">Ainda não há comentários. Faça a primeira pergunta sobre o lugar.</p>}
          {comments.map(c=><div className="rr-social-comment" key={c.id}>
            <span className="rr-social-author-icon">{c.author_name?.[0]?.toUpperCase()||"V"}</span>
            <div className="rr-social-comment-body"><b>{c.author_name}</b><small>{new Date(c.created_at).toLocaleDateString("pt-BR")}</small>
              {editing===c.id?<><textarea maxLength={700} value={editText} onChange={e=>setEditText(e.target.value)} rows={2}/><div className="rr-social-comment-tools"><button type="button" onClick={()=>saveComment(c)}><Check size={15}/>Salvar</button><button type="button" onClick={()=>setEditing(null)}><X size={15}/>Cancelar</button></div></>:<p>{c.body}</p>}
              {c.user_id!==user?.id&&<div className="rr-social-comment-tools"><button type="button" disabled={reported.includes(c.id)} onClick={()=>report(c)}><ShieldAlert size={14}/>{reported.includes(c.id)?"Denunciado":"Denunciar"}</button></div>}
              {c.user_id===user?.id&&editing!==c.id&&<div className="rr-social-comment-tools"><button type="button" onClick={()=>{setEditing(c.id);setEditText(c.body);}}><Pencil size={14}/>Editar</button><button type="button" onClick={()=>removeComment(c)}><Trash2 size={14}/>Excluir</button></div>}
            </div>
          </div>)}
          <form className="rr-social-comment-form" onSubmit={addComment}>
            <label htmlFor={"rr-comment-"+item.id}>Perguntar ou comentar</label>
            <div><textarea id={"rr-comment-"+item.id} rows={2} maxLength={700} placeholder="Qual é a dica para conhecer esse lugar?" value={commentText} onChange={e=>setCommentText(e.target.value)}/><button type="submit" disabled={busy||!commentText.trim()} aria-label="Publicar comentário"><Send size={19}/></button></div>
          </form>
        </div>
      </div>
    </Sheet>}
  </>;
}
