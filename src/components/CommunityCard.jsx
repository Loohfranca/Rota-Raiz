import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, MapPin, ArrowUpRight, Bookmark, ChevronRight, Image as ImageIcon, Trash2, Send, Pencil, Check, X } from "lucide-react";
import Sheet from "./Sheet";
import * as api from "../lib/community";

function Instagram({size=18}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" />
  </svg>;
}
export default function CommunityCard({ item, user, stats, onRoute, onSavePlace, onRefresh, onError, onEdit, onDelete }) {
  const [open,setOpen]=useState(false);
  const [liked,setLiked]=useState(false);
  const [likes,setLikes]=useState(0);
  const [count,setCount]=useState(0);
  const [comments,setComments]=useState([]);
  const [busy,setBusy]=useState(false);
  const [commentText,setCommentText]=useState("");
  const [editing,setEditing]=useState(null);
  const [editText,setEditText]=useState("");
  const [imageFile,setImageFile]=useState(null);
  const [imageBusy,setImageBusy]=useState(false);
  const [imageUrl,setImageUrl]=useState(item.image_url || "");
  useEffect(()=>{setLikes(stats?.likes||0);setCount(stats?.comments||0);setLiked(!!stats?.liked);},[stats]);
  useEffect(()=>{setImageUrl(item.image_url||"");},[item.image_url]);
  async function openDetail() {
    setOpen(true);
    try { setComments(await api.getComments(item.id)); } catch(e) { onError(e.message); }
  }
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
      setComments(cs=>[...cs,added]);setCount(n=>n+1);setCommentText("");
    } catch(err){onError(err.message);} finally{setBusy(false);}
  }
  async function removeComment(c) {
    if(!window.confirm("Excluir este comentário?"))return;
    try {await api.deleteComment(c.id);setComments(cs=>cs.filter(x=>x.id!==c.id));setCount(n=>Math.max(0,n-1));}
    catch(err){onError(err.message);}
  }
  async function saveComment(c) {
    if(!editText.trim())return;
    try {const next=await api.editComment(c.id,editText);setComments(cs=>cs.map(x=>x.id===c.id?next:x));setEditing(null);setEditText("");}
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
    try {await onSavePlace({id:"community-"+item.id,title:item.name,location:item.city,address:item.address});}
    catch(err){onError(err.message);}
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
          <span className="rr-social-category">{item.category} · {location}</span>
          <h3>{item.name}</h3>
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
        <button type="button" className="rr-social-save" onClick={saveExperience} title="Salvar nas Experiências"><Bookmark size={16}/><span>Salvar</span></button>
      </div>
    </article>
    {open&&<Sheet title={item.name} onClose={()=>setOpen(false)}>
      <div className="rr-social-detail">
        {photo?<img className="rr-social-detail-photo" src={photo} alt={"Fotografia de "+item.name}/>:
          <div className="rr-social-detail-empty"><ImageIcon size={32}/><span>Sem foto ainda</span></div>}
        <p className="rr-social-category">{item.category} · {item.city}</p>
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
          <b>Fotografia do lugar</b>
          <label className="rr-social-upload-label">Selecionar foto (JPG, PNG ou WebP, até 3 MB)
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setImageFile(e.target.files?.[0]||null)}/>
          </label>
          {imageFile&&<button type="button" disabled={imageBusy} onClick={uploadPhoto}>{imageBusy?"Enviando…":"Salvar foto"}</button>}
          {photo&&<button type="button" disabled={imageBusy} onClick={deletePhoto}><Trash2 size={15}/>Remover foto</button>}
        </div>}
        <div className="rr-social-comments">
          <h3>Comentários ({count})</h3>
          {!comments.length&&<p className="rr-social-empty-comments">Ainda não há comentários. Faça a primeira pergunta sobre o lugar.</p>}
          {comments.map(c=><div className="rr-social-comment" key={c.id}>
            <span className="rr-social-author-icon">{c.author_name?.[0]?.toUpperCase()||"V"}</span>
            <div className="rr-social-comment-body"><b>{c.author_name}</b><small>{new Date(c.created_at).toLocaleDateString("pt-BR")}</small>
              {editing===c.id?<><textarea maxLength={700} value={editText} onChange={e=>setEditText(e.target.value)} rows={2}/><div className="rr-social-comment-tools"><button type="button" onClick={()=>saveComment(c)}><Check size={15}/>Salvar</button><button type="button" onClick={()=>setEditing(null)}><X size={15}/>Cancelar</button></div></>:<p>{c.body}</p>}
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
