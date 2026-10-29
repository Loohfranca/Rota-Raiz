import React from "react";
import { Users, Utensils, MapPin, ChevronRight } from "lucide-react";
export default function CommunitySuggestions({groups=[],onOpen}) {
  if(!groups.length)return null;
  return <section className="explore-community-results" aria-label="Lugares indicados pela comunidade">
    <div className="explore-community-label"><Users size={16}/><h3>Quem viaja indica</h3></div>
    <div className="explore-community-grid">
      {groups.map(group=>{const item=group[0];return <button type="button" className="explore-community-place" key={item.id} onClick={()=>onOpen(item.id)} aria-label={`Ver ${item.name} na Comunidade`}>
        <span className="explore-community-photo">{item.category==='Comida'||item.category==='Alimentação'?<Utensils size={24}/>:<MapPin size={24}/>} {item.image_url && <img src={item.image_url} alt="" loading="lazy" onError={event=>{event.currentTarget.style.display="none";}}/>}</span>
        <span className="explore-community-copy"><small>{item.category==='Comida'?'Alimentação':item.category} · {item.city}</small><strong>{item.name}</strong><span>{item.note}</span><small>{group.length>1?`${group.length} indicações deste lugar`:`Indicação de ${item.author_name || 'um viajante'}`}</small></span>
        <ChevronRight size={18}/>
      </button>;})}
    </div>
  </section>;
}
