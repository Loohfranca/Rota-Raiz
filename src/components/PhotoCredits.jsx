import React, { useRef } from 'react';
import { Info, X } from 'lucide-react';
import { BEACHES } from '../data/beachCatalog';
import { PLACES } from '../data/seedData';
import { getTourPhotos } from '../lib/photos';
export default function PhotoCredits(){
 const dialog=useRef(null);
 const destinations=[...BEACHES,...PLACES.filter(p=>!BEACHES.some(b=>b.id===p.id)&&p.id!=='caraiva-prainha')];
 return <><button className="photos-about-button" aria-label="Sobre as fotos" title="Sobre as fotos" onClick={()=>dialog.current.showModal()}><Info size={18}/></button><dialog ref={dialog} className="photo-rights-dialog" onClick={e=>{if(e.target===e.currentTarget)dialog.current.close();}}><div className="photo-rights-content"><header><h2>Sobre as fotos</h2><button className="icon-button" aria-label="Fechar informações das fotos" onClick={()=>dialog.current.close()}><X size={20}/></button></header><p>Imagens dos destinos, enquadradas para exibição no app.</p>{destinations.map(tour=><section key={tour.id}><h3>{tour.title}</h3>{getTourPhotos(tour).map((p,n)=><p key={p.url}><a href={p.source} target="_blank" rel="noopener noreferrer">{p.caption||`Foto ${n+1}`} · {p.author}</a>{' · '}<a href={p.licenseUrl} target="_blank" rel="noopener noreferrer">{p.license}</a></p>)}</section>)}</div></dialog></>;
}
