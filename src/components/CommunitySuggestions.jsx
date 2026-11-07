import {communityPlace, placeGroupKey} from "../lib/communityGroups";
import React from "react";
import { Users, Utensils, MapPin, ChevronRight } from "lucide-react";
export default function CommunitySuggestions({groups=[],onOpen,showHeading=true}) {
  if(!groups.length)return null;
  return <section className="explore-community-results" aria-label="Lugares indicados pela comunidade">
    {showHeading&&<div className="explore-community-label"><Users size={16}/><h3>Quem viaja indica</h3></div>}
    <div className="explore-community-grid">
      {groups.map(group=>{const item=group[0],place=communityPlace(item);return <button type="button" className="explore-community-place" key={placeGroupKey(item)} onClick={()=>onOpen(item.id)} aria-label={`Ver ${place.name} na Comunidade`}>
        <span className="explore-community-photo">{item.category==='Comida'||item.category==='Alimentação'?<Utensils size={24}/>:<MapPin size={24}/>} {item.image_url && <img src={item.image_url} alt="" loading="lazy" onError={event=>{event.currentTarget.style.display="none";}}/>}</span>
        <span className="explore-community-copy"><small>{place.category==='Comida'?'Alimentação':place.category} · {place.city}</small><strong>{place.name}</strong><span>{item.note}</span><small>{item.author_name || 'Viajante'} · {group.length} {group.length===1?'indicação':'indicações'}</small></span>
        <ChevronRight size={18}/>
      </button>;})}
    </div>
  </section>;
}
