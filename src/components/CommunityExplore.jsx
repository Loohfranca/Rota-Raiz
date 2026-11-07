import React, {useEffect, useState} from "react";
import {Bookmark, LocateFixed, MapPin, Plus, Search} from "lucide-react";
import CommunitySuggestions from "./CommunitySuggestions";
import {getRecommendations} from "../lib/community";
import {communityPlace, groupCommunityRecommendations, normalizePlaceText} from "../lib/communityGroups";
import {currentPosition, reverseSuggestion} from "../lib/placeLocation";
import {reversePlacePoint} from "../lib/geocode";
import {getSavedTours, removeSavedTourOffline} from "../lib/supabase";
import {REGIONS} from "../lib/nearby";
import "./CommunityExplore.css";

const filters=[["all","Todos"],["food","Comer e beber"],["outings","Passeios"],["beaches","Praias"],["stays","Hospedagem"]];
const key="rr_explore_city";
const fold=normalizePlaceText;
const cityName=value=>fold(value.split(/,|\s[-–]\s/)[0]);
const stateCode=value=>value.match(/[,–-]\s*([A-Z]{2})\s*$/)?.[1];
function matchesCity(value, selection){
  if(!value || !selection || cityName(value)!==cityName(selection)) return !selection;
  return !stateCode(value) || !stateCode(selection) || stateCode(value)===stateCode(selection);
}
const categoryOf=category=>/comida|alimentação|bar|restaurante/i.test(category)?"food":category==="Praia"?"beaches":category==="Hospedagem"?"stays":"outings";

export default function CommunityExplore({onOpenCommunity,onRecommend,onSelectTour,visible=true,loadRecommendations=getRecommendations,locate=currentPosition,reverse=reversePlacePoint}) {
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(false);
  const [reload,setReload]=useState(0);
  const [city,setCity]=useState(()=>{try{return sessionStorage.getItem(key)||"";}catch{return "";}});
  const [draft,setDraft]=useState(city);
  const [cityEditor,setCityEditor]=useState(false);
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("all");
  const [locating,setLocating]=useState(false);
  const [locationError,setLocationError]=useState("");
  const [showSaved,setShowSaved]=useState(false);
  const [saved,setSaved]=useState(getSavedTours);
  const [saveError,setSaveError]=useState("");
  const cityVersion=React.useRef(0);

  useEffect(()=>{
    if(!visible || showSaved)return;
    let active=true,busy=false;
    async function refresh(){
      if(busy || document.hidden)return;
      busy=true;
      try{
        const result=await loadRecommendations();
        if(!result.available)throw Error();
        if(active){setItems(result.items);setError(false);}
      }catch{if(active)setError(true);}
      finally{busy=false;if(active)setLoading(false);}
    }
    refresh();
    window.addEventListener("focus",refresh);
    window.addEventListener("online",refresh);
    document.addEventListener("visibilitychange",refresh);
    return()=>{active=false;window.removeEventListener("focus",refresh);window.removeEventListener("online",refresh);document.removeEventListener("visibilitychange",refresh);};
  },[visible,showSaved,loadRecommendations,reload]);
  useEffect(()=>{if(visible)setSaved(getSavedTours());},[visible]);

  function chooseCity(value){
    cityVersion.current++;
    const next=value.trim();
    setCity(next);setDraft(next);setCityEditor(false);setLocationError("");setQuery("");setCategory("all");
    try{sessionStorage.setItem(key,next);}catch{}
  }
  async function useLocation(){
    const version=++cityVersion.current;
    setLocating(true);setLocationError("");
    try{
      const {municipality,state}=reverseSuggestion(await reverse(await locate()));
      if(!municipality)throw Error();
      if(version===cityVersion.current)chooseCity([municipality,state].filter(Boolean).join(", "));
    }catch{if(version===cityVersion.current){setLocationError("Não foi possível identificar sua cidade. Escolha uma cidade abaixo.");setCityEditor(true);}}
    finally{setLocating(false);}
  }
  const groups=groupCommunityRecommendations(items);
  const cityGroups=groups.filter(([item])=>{
    const place=communityPlace(item);
    return matchesCity(place.city,city) || (!!city && fold(place.destination)===fold(city));
  });
  const results=cityGroups.filter(group=>{
    const place=communityPlace(group[0]);
    return (category==="all" || categoryOf(place.category)===category) &&
      group.some(item=>fold([place.name,place.city,place.destination,item.note,item.author_name].join(" ")).includes(fold(query)));
  });
  const indicationCount=results.reduce((sum,group)=>sum+group.length,0);
  const publishedCities=[...new Set(groups.map(([item])=>communityPlace(item).city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  const cityOptions=[...new Set([...publishedCities,...REGIONS.map(region=>region.name)])];

  return <section className="rr-explore" aria-labelledby="rr-explore-title">
    <div className="rr-explore-heading">
      <div><p className="eyebrow">INDICAÇÕES DA COMUNIDADE</p><h1 id="rr-explore-title">{showSaved?"Lugares salvos":"Descubra onde ir"}</h1></div>
      <button type="button" className="small-action" aria-pressed={showSaved} onClick={()=>setShowSaved(value=>!value)}><Bookmark size={18}/> {showSaved?"Explorar":`Salvos (${Object.keys(saved).length})`}</button>
    </div>
    {showSaved?<div className="rr-explore-saved">
      {saveError&&<p role="alert">{saveError}</p>}
      {Object.values(saved).length===0&&<p>Nenhum passeio salvo neste aparelho.</p>}
      {Object.entries(saved).map(([savedId,place])=><article key={savedId}>
        <button type="button" onClick={()=>onSelectTour(place)}>{place.title}</button>
        <button type="button" className="small-action" aria-label={`Remover ${place.title} dos salvos`} onClick={()=>{
          try{setSaved(removeSavedTourOffline(savedId));setSaveError("");}catch{setSaveError("Não foi possível atualizar os salvos neste aparelho.");}
        }}><Bookmark size={17}/> Remover</button>
      </article>)}
    </div>:<>
      <div className="rr-explore-location">
        <div className="rr-explore-location-top"><span><MapPin size={19}/><strong>{city||"Todas as cidades"}</strong></span><button type="button" className="rr-explore-text-action" aria-expanded={cityEditor} onClick={()=>setCityEditor(value=>!value)}>{cityEditor?"Fechar":"Alterar cidade"}</button></div>
        <div className="rr-explore-location-top">
          <button type="button" className="small-action" disabled={locating} onClick={useLocation}><LocateFixed size={17}/>{locating?"Localizando…":"Usar minha localização"}</button>
        </div>
        {cityEditor&&<form onSubmit={event=>{event.preventDefault();chooseCity(draft);}}>
          <label htmlFor="rr-explore-city">Cidade ou destino</label>
          <div><input id="rr-explore-city" list="rr-explore-cities" value={draft} onChange={event=>setDraft(event.target.value)} placeholder="Ex.: Salvador" maxLength={120}/>
            <datalist id="rr-explore-cities">{cityOptions.map(name=><option key={name} value={name}/>)}</datalist>
            <button className="small-action" type="submit">Buscar</button>
          </div>
        </form>}
        {cityEditor&&city&&<button type="button" className="rr-explore-text-action" onClick={()=>chooseCity("")}>Ver todas as cidades</button>}
        {locationError&&<p role="status">{locationError}</p>}
      </div>
      <div className="rr-explore-tools">
        <label><Search size={18}/><input aria-label="Buscar nas indicações" placeholder="Buscar um lugar ou uma dica" value={query} onChange={event=>setQuery(event.target.value)}/></label>
        <div className="explore-category-filters" role="group" aria-label="Tipos de lugar">{filters.map(([id,label])=><button type="button" key={id} aria-pressed={category===id} onClick={()=>setCategory(id)}>{label}</button>)}</div>
      </div>
      <div className="rr-explore-results-title"><h2>{city?`Indicações em ${city}`:"Indicações da comunidade"}</h2><button type="button" className="small-action" onClick={onRecommend}><Plus size={17}/> Indicar lugar</button></div>
      {loading?<p role="status">Buscando indicações…</p>:error?<div className="rr-explore-empty" role="status"><p>Não foi possível atualizar as indicações.</p><button type="button" className="small-action" onClick={()=>{setLoading(true);setReload(value=>value+1);}}>Tentar novamente</button></div>:null}
      {!loading&&!error&&<p className="catalog-count" aria-live="polite">{results.length} {results.length===1?"lugar":"lugares"} · {indicationCount} {indicationCount===1?"indicação":"indicações"}</p>}
      {!!results.length&&<CommunitySuggestions groups={results} onOpen={onOpenCommunity} showHeading={false}/>}
      {!loading&&!error&&!results.length&&<div className="rr-explore-empty">
        <h3>{cityGroups.length?"Nenhuma indicação com esses filtros.":city?`Ainda não há indicações em ${city}.`:"Ainda não há indicações publicadas."}</h3>
        <p>{cityGroups.length?"Experimente outro termo ou tipo de lugar.":"Conhece um lugar que vale a visita? Compartilhe com a comunidade."}</p>
        {cityGroups.length?<button type="button" className="small-action" onClick={()=>{setQuery("");setCategory("all");}}>Limpar filtros</button>:<button type="button" className="small-action" onClick={onRecommend}><Plus size={17}/> Indicar lugar</button>}
        {!cityGroups.length&&!!publishedCities.length&&<div className="rr-explore-other"><p>Outras cidades com indicações</p>{publishedCities.slice(0,5).map(name=><button type="button" key={name} className="small-action" onClick={()=>chooseCity(name)}>{name}</button>)}</div>}
      </div>}
    </>}
  </section>;
}
