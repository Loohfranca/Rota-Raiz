import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X, Images, MapPin } from 'lucide-react';
import { getTourPhotos } from '../lib/photos';
import BeachPhoto from './BeachPhoto';
export default function PhotoGallery({tour,onOpenMap}) {
  const photos=getTourPhotos(tour), [index,setIndex]=useState(0), [failed,setFailed]=useState([]);
  const dialog=useRef(null),start=useRef(null);
  const available=photos.filter(p=>!failed.includes(p.url));
  const active=available[index%Math.max(available.length,1)];
  const move=direction=>setIndex(n=>(n+direction+available.length)%available.length);
  const swipe={onPointerDown:e=>{start.current={x:e.clientX,y:e.clientY};},onPointerUp:e=>{if(!start.current)return;const dx=e.clientX-start.current.x,dy=e.clientY-start.current.y;start.current=null;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)&&available.length>1)move(dx<0?1:-1);},onPointerCancel:()=>{start.current=null;}};
  const fail=url=>{setFailed(previous=>[...previous,url]);setIndex(0);};
  if(!active)return <div className="detail-hero"><BeachPhoto tour={tour} className="detail-photo"/><button className="photo-map-button" onClick={onOpenMap}><MapPin size={17}/>Ver no mapa</button></div>;
  return <section className="photo-gallery" aria-label={`Fotos de ${tour.title}`}>
    <div className="gallery-stage" {...swipe}>
      <button className="gallery-open" onClick={()=>dialog.current.showModal()} aria-label={`Ampliar foto ${index%available.length+1} de ${tour.title}`}><img src={active.url} alt={active.caption||tour.title} onError={()=>fail(active.url)} draggable="false"/></button>
      <div className="gallery-topline"><span><Images size={15}/>{index%available.length+1} / {available.length}</span><button onClick={()=>dialog.current.showModal()} aria-label="Abrir galeria em tela cheia"><Expand size={18}/></button></div>
      {available.length>1&&<><button className="gallery-arrow gallery-prev" aria-label="Foto anterior" onClick={()=>move(-1)}><ChevronLeft size={24}/></button><button className="gallery-arrow gallery-next" aria-label="Próxima foto" onClick={()=>move(1)}><ChevronRight size={24}/></button></>}
      <button className="photo-map-button" onClick={onOpenMap}><MapPin size={17}/>Ver no mapa</button>
    </div>
    {available.length>1&&<div className="gallery-thumbnails" aria-label="Escolher foto">{available.map((photo,n)=><button key={photo.url} aria-label={`Ver foto ${n+1}: ${photo.caption||tour.title}`} aria-pressed={n===index%available.length} onClick={()=>setIndex(n)}><img src={photo.url} alt="" loading="lazy" draggable="false" onError={()=>fail(photo.url)}/></button>)}</div>}
    <dialog ref={dialog} className="gallery-dialog" onClick={e=>{if(e.target===e.currentTarget)dialog.current.close();}} onKeyDown={e=>{if(e.key==='ArrowRight'&&available.length>1){e.preventDefault();move(1);}if(e.key==='ArrowLeft'&&available.length>1){e.preventDefault();move(-1);}}}>
      <div className="gallery-dialog-content"><header><div><strong>{tour.title}</strong><span>{index%available.length+1} de {available.length}</span></div><button className="icon-button" onClick={()=>dialog.current.close()} aria-label="Fechar galeria"><X size={22}/></button></header><div className="gallery-full-image" {...swipe}><img src={active.url} alt={active.caption||tour.title} draggable="false" onError={()=>fail(active.url)}/>{available.length>1&&<><button className="gallery-arrow gallery-prev" aria-label="Foto anterior em tela cheia" onClick={()=>move(-1)}><ChevronLeft size={27}/></button><button className="gallery-arrow gallery-next" aria-label="Próxima foto em tela cheia" onClick={()=>move(1)}><ChevronRight size={27}/></button></>}</div><p className="gallery-caption" aria-live="polite">{active.caption||tour.title}</p></div>
    </dialog>
  </section>;
}
