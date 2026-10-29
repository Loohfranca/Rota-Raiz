import LocalAutocomplete from "./LocalAutocomplete";
import { normalizeText } from "../lib/router";
import ExploreHero from "./ExploreHero";
import BrazilDiscovery from "./BrazilDiscovery";
import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  ArrowUpRight,
  Bookmark,
  Search,
  Navigation,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import {
  getPlaces,
  getStops,
  getCities,
  getSavedTours,
  toggleSaveTourOffline,
} from "../lib/supabase";
import { AIRPORTS } from "../data/travelNetwork";
import { getTourPhotos } from "../lib/photos";
import { Images } from "lucide-react";
import CommunitySuggestions from "./CommunitySuggestions";
import BeachPhoto from "./BeachPhoto";
import OriginPicker from "./OriginPicker";
import { BEACHES, LODGINGS } from "../data/beachCatalog";
import { selectBeaches, nearestRegion, REGIONS } from "../lib/nearby";
import { hasCoordinates } from "../lib/walking";
const FEATURED_DESTINATIONS = ["rj-copacabana", "caraiva-praia", "trancoso-quadrado", "ssa-farol-barra", "jpa-tambau"].map(id => BEACHES.find(place => place.id === id)).filter(Boolean);

export default function ToursView({
  home,
  onChangeHome,
  onSelectTour,
  visible = true,
  onRoute,
  onSaveTour,
}) {
  const [places, setPlaces] = useState(BEACHES),
    [stops, setStops] = useState([]),
    [cities, setCities] = useState(REGIONS);
  const [query, setQuery] = useState(""),
    [region, setRegion] = useState(() => nearestRegion(home)?.id || "all"),
    [onlySaved, setOnlySaved] = useState(false),
    [saved, setSaved] = useState(getSavedTours),
    [error, setError] = useState("");
  const regionOptions = [{id:"all",name:"Todos os destinos"},{id:"auto",name:"Perto do ponto de partida"},...REGIONS];
  const [cityQuery, setCityQuery] = useState(() => nearestRegion(home)?.name || "Todos os destinos");
  const [category, setCategory] = useState("all");
  const [originOpen, setOriginOpen] = useState(false);
  const [savingPlace,setSavingPlace] = useState(null);
  const returnPosition = useRef(null);
  useEffect(() => {
    let active = true;
    Promise.all([getPlaces(), getStops(), getCities()])
      .then(([data, s, c]) => {
        if (!active) return;
        const byId = new Map(
          data.filter((i) => i.id !== "caraiva-prainha").map((i) => [i.id, i]),
        );
        BEACHES.forEach((i) => byId.set(i.id, { ...byId.get(i.id), ...i }));
        setPlaces([...byId.values()]);
        setStops(s);
        setCities(c);
      })
      .catch(
        () =>
          active && setError("Mostrando o catálogo disponível neste aparelho."),
      );
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!visible) return;
    setSaved(getSavedTours());
    const frame = requestAnimationFrame(() => {
      if (returnPosition.current != null) {
        window.scrollTo({ top: returnPosition.current, behavior: "instant" });
        returnPosition.current = null;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [visible]);
  const near = nearestRegion(home),
    outOfRange =
      region === "auto" && hasCoordinates(home) && !near && !onlySaved;
  const matches = selectBeaches(
    onlySaved
      ? Object.values(saved).map((i) => ({
          ...i,
          ...BEACHES.find((b) => b.id === i.id),
        }))
      : places,
    { home, region, query, savedIds: onlySaved ? Object.keys(saved) : null },
  );
  const categoryOf = place => /praia/i.test(place.category || "") ? "beaches" : /alimenta|comida|restaurante/i.test(place.category || "") ? "food" : "outings";
  const filtered = matches.filter(place => category === "all" || categoryOf(place) === category);
  const regionName =
    REGIONS.find((i) => i.id === region)?.name ||
    (region === "auto" ? near?.name : null);
  const cityLabel = regionOptions.find(item => item.id === region)?.name || "Todos os destinos";
  const citySuggestions = regionOptions.filter(item => cityQuery === cityLabel || normalizeText(item.name).includes(normalizeText(cityQuery))).map(item => ({id:item.id,label:item.name,detail:item.id === "auto" ? "Usa a origem dos trajetos" : item.id === "all" ? "Catálogo do Rota Raiz" : "Explorar os lugares cadastrados"}));
  const chooseCity = item => {setRegion(item.id); setCityQuery(item.label); setOnlySaved(false); setQuery(""); setCategory("all");};
  const toggle = async (place) => {
    if(savingPlace)return;setSavingPlace(place.id);
    try {
      if(!saved[place.id] && onSaveTour && !(await onSaveTour(place))) return;
      toggleSaveTourOffline(place.id, { ...place, savedOrigin: home });
      setSaved(getSavedTours());
      setError("");
    } catch {
      setError("Não foi possível salvar neste aparelho.");
    } finally {setSavingPlace(null);}
  };
  const open = (place) => {
    returnPosition.current = window.scrollY;
    onSelectTour(place);
  };
  return (
    <div className="explore-page">
      <section className="discovery-section">
        <div className="discovery-top">
          <div>
            <p className="eyebrow">Seu próximo lugar</p>
            <h2>
              {onlySaved
                ? "Seus lugares salvos"
                : regionName
                  ? `Explore ${regionName}`
                  : "Explore os destinos"}
            </h2>
          </div>
          <button
            className={`saved-filter ${onlySaved ? "is-active" : ""}`}
            onClick={() => setOnlySaved(!onlySaved)}
            aria-pressed={onlySaved}
          >
            <Bookmark size={17} />
            <span>Salvos</span>
            <b>{Object.keys(saved).length}</b>
          </button>
        </div>
        <div className="discovery-controls">
          <div className="explore-city-select">
            <MapPin size={18} />
            <LocalAutocomplete label="Cidade para explorar" value={cityQuery} onChange={setCityQuery} items={citySuggestions} onSelect={chooseCity} onCancel={() => setCityQuery(cityLabel)} placeholder="Digite uma cidade do catálogo" />
            <ChevronDown size={16} aria-hidden="true" />
          </div>
          <div className="search-field beach-search">
            <Search size={18} />
            <LocalAutocomplete label="Buscar lugares" value={query} onChange={setQuery} showOnFocus={false}
              items={query.trim().length >= 2 ? filtered.slice(0,5).map(place => ({id:place.id,label:place.title,detail:place.location,place})) : []}
              onSelect={item => {setQuery(item.label); open(item.place);}}
              placeholder={regionName && !onlySaved ? `Buscar lugares em ${regionName}` : "Buscar praia, passeio ou lugar"} />
            {query && <button onClick={() => setQuery("")} aria-label="Limpar busca de lugares">×</button>}
          </div>
        </div>
        <div className="explore-category-filters" role="group" aria-label="Tipos de lugar">
          {[['all','Todos'],['beaches','Praias'],['food','Alimentação'],['outings','Passeios']].map(([id,label]) => <button key={id} aria-pressed={category === id} onClick={() => setCategory(id)}>{label}</button>)}
        </div>
        <details className="explore-origin" open={originOpen} onToggle={e => setOriginOpen(e.currentTarget.open)}>
          <summary><Navigation size={16} /><span>{hasCoordinates(home) ? <>Saindo de: <b>{home.name}</b></> : "Definir ponto de partida"}</span><span className="explore-origin-action">{originOpen ? "Fechar" : "Alterar"}<ChevronDown size={15} /></span></summary>
          {originOpen && <div className="explore-origin-content"><p>Usado nas distâncias e trajetos. Você pode explorar outra cidade sem mudar esta origem.</p><OriginPicker editorOnly home={home} onChange={onChangeHome} stops={stops} cities={cities} places={[...places,...AIRPORTS,...LODGINGS.map(i => ({...i,title:i.name}))]} /></div>}
        </details>
        {region === "auto" && !onlySaved && !outOfRange && (
          <p className="catalog-context">
            {near
              ? "Ordenadas pela proximidade da sua origem. Distâncias em linha reta; veja o percurso nos detalhes."
              : "Defina uma origem acima para encontrar lugares próximos."}
          </p>
        )}
        {onlySaved && (
          <p className="catalog-context">
            Os passeios salvos ficam neste navegador. O fundo do mapa e as fotos
            precisam de conexão.
          </p>
        )}
        {error && (
          <p className="inline-notice" role="status">
            {error}
          </p>
        )}
        {outOfRange ? (
          <div className="empty-state">
            <MapPin size={30} />
            <h3>Vamos planejar sua chegada?</h3>
            <p>
              Ainda não há lugares cadastrados perto desta origem. Explore as
              cidades disponíveis na seleção acima.
            </p>
            <button
              className="button button-primary"
              onClick={() => chooseCity({id:"all",label:"Todos os destinos"})}
            >
              Explorar os destinos <ArrowRight size={17} />
            </button>
          </div>
        ) : (
          <>
            <div className="catalog-count" aria-live="polite">
              {filtered.length}{" "}
              {filtered.length === 1
                ? "lugar para conhecer"
                : "lugares para conhecer"}
            </div>
            <div className="beach-grid">
              {filtered.map((place) => (
                <article
                  key={place.id}
                  className={`beach-card ${place.photo ? "has-photo" : "without-photo"}`}
                >
                  <div className="beach-card-visual">
                    {getTourPhotos(place).length > 1 && (
                      <span className="card-photo-count">
                        <Images size={13} />
                        {getTourPhotos(place).length} fotos
                      </span>
                    )}
                    <BeachPhoto tour={place} className="beach-card-photo" />
                    <span className="beach-location">
                      <MapPin size={13} />
                      {place.location?.split(",")[0]}
                    </span>
                    <button
                      className={`save-beach ${saved[place.id] ? "is-saved" : ""}`}
                      aria-label={
                        saved[place.id]
                          ? `Remover ${place.title} dos salvos`
                          : `Salvar ${place.title}`
                      }
                      aria-pressed={!!saved[place.id]}
                      disabled={!!savingPlace}
                      onClick={() => toggle(place)}
                    >
                      <Bookmark
                        size={18}
                        fill={saved[place.id] ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                  <div className="beach-card-body">
                    <span className="beach-card-region">
                      {place.location?.split(",")[0]}
                    </span>
                    <h3>
                      <button
                        type="button"
                        className="beach-card-open"
                        onClick={() => open(place)}
                        aria-label={`Ver detalhes de ${place.title}`}
                      >
                        {place.title}
                      </button>
                    </h3>
                    <p>{place.subtitle}</p>
                    <div className="beach-card-facts">
                      {place.distanceKm != null ? (
                        <span>
                          <Navigation size={14} />
                          {Number(place.distanceKm).toLocaleString("pt-BR", {
                            maximumFractionDigits: 1,
                          })}{" "}
                          km <small>em linha reta</small>
                        </span>
                      ) : null}
                    </div>
                    <span className="beach-details" aria-hidden="true">
                      Ver detalhes <ArrowUpRight size={17} />
                    </span>
                  </div>
                </article>
              ))}
            </div>
            {!filtered.length && (
              <div className="empty-state">
                <Bookmark size={28} />
                <h3>
                  {onlySaved
                    ? "Sua próxima descoberta fica aqui"
                    : "Nenhum lugar nesta seleção"}
                </h3>
                <p>
                  {onlySaved
                    ? "Toque no marcador de uma praia para salvar o passeio."
                    : "Tente outro nome ou filtro. Você também pode buscar mais opções no Maps abaixo."}
                </p>
                {onlySaved && (
                  <button
                    className="button button-secondary"
                    onClick={() => setOnlySaved(false)}
                  >
                    Explorar praias
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </section>
      <CommunitySuggestions home={home} city={onlySaved ? "" : regionName || ""} onRoute={onRoute} />
      {!onlySaved && <details className="explore-more" key={`${regionName || "brasil"}-${category}`}>
        <summary><Search size={18} /><span>{regionName ? `Buscar mais lugares em ${regionName}` : "Buscar em outra cidade do Brasil"}</span><ArrowUpRight size={16} /></summary>
        <BrazilDiscovery initialCity={regionName || ""} fixedCity={!!regionName} initialCategory={category === "food" ? "food" : category === "beaches" ? "beaches" : "attractions"} />
      </details>}
      {!onlySaved && <section className="explore-inspiration" aria-label="Inspiração para outras viagens"><h2>Inspire sua próxima viagem</h2><ExploreHero destinations={FEATURED_DESTINATIONS} visible={visible} onSelect={open} /></section>}
    </div>
  );
}
