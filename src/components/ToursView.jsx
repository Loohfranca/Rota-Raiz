import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  ArrowUpRight,
  Bookmark,
  Search,
  Compass,
  Navigation,
  ArrowRight,
} from "lucide-react";
import {
  getPlaces,
  getStops,
  getCities,
  getSavedTours,
  toggleSaveTourOffline,
} from "../lib/supabase";
import { getTourPhotos } from "../lib/photos";
import { Images } from "lucide-react";
import BeachPhoto from "./BeachPhoto";
import OriginPicker from "./OriginPicker";
import { BEACHES, LODGINGS } from "../data/beachCatalog";
import { selectBeaches, nearestRegion, REGIONS } from "../lib/nearby";
import { hasCoordinates } from "../lib/walking";
export default function ToursView({
  home,
  onChangeHome,
  onSelectTour,
  visible = true,
}) {
  const [places, setPlaces] = useState(BEACHES),
    [stops, setStops] = useState([]),
    [cities, setCities] = useState(REGIONS);
  const [query, setQuery] = useState(""),
    [region, setRegion] = useState("auto"),
    [onlySaved, setOnlySaved] = useState(false),
    [saved, setSaved] = useState(getSavedTours),
    [error, setError] = useState("");
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
  const filtered = selectBeaches(
    onlySaved
      ? Object.values(saved).map((i) => ({
          ...i,
          ...BEACHES.find((b) => b.id === i.id),
        }))
      : places,
    { home, region, query, savedIds: onlySaved ? Object.keys(saved) : null },
  );
  const regionName =
    REGIONS.find((i) => i.id === region)?.name ||
    (region === "auto" ? near?.name : null);
  const toggle = (place) => {
    try {
      toggleSaveTourOffline(place.id, { ...place, savedOrigin: home });
      setSaved(getSavedTours());
      setError("");
    } catch {
      setError("Não foi possível salvar neste aparelho.");
    }
  };
  const open = (place) => {
    returnPosition.current = window.scrollY;
    if (onlySaved && place.savedOrigin) onChangeHome(place.savedOrigin);
    onSelectTour(place);
  };
  const hero = BEACHES.find(
    (i) =>
      i.id ===
      (regionName === "Porto Seguro"
        ? "taperapua"
        : regionName === "Arraial d’Ajuda"
          ? "pitinga"
          : "satu"),
  );
  return (
    <div className="explore-page">
      <section className="explore-hero">
        <div className="explore-intro">
          <p className="eyebrow">
            <span className="tiny-line" />
            Entre o rio e o mar
          </p>
          <h1>
            Seu próximo
            <br />
            <span>caminho é por aqui.</span>
          </h1>
          <p>
            Praias, travessias e descobertas.
            <br />
            Encontre seu lugar e veja como chegar.
          </p>
          <span className="hero-signature">
            <Compass size={17} />
            Viva o lugar. Vá no seu ritmo.
          </span>
        </div>
        <div className="hero-landscape">
          <BeachPhoto tour={hero} className="hero-beach-photo" />
          <div className="hero-photo-label">
            <MapPin size={15} />
            <span>
              {hero.title}
              <small>{hero.location.split(",")[0]}</small>
            </span>
          </div>
        </div>
      </section>
      <OriginPicker
        home={home}
        onChange={onChangeHome}
        stops={stops}
        cities={cities}
        places={[...places, ...LODGINGS.map((i) => ({ ...i, title: i.name }))]}
      />
      <section className="discovery-section">
        <div className="discovery-top">
          <div>
            <p className="eyebrow">Descubra seu destino</p>
            <h2>
              {onlySaved
                ? "Seus lugares salvos"
                : regionName
                  ? `Explore ${regionName}`
                  : "Onde a viagem acontece"}
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
          <div
            className="region-filters"
            role="group"
            aria-label="Região das praias"
          >
            {[
              { id: "auto", name: "Perto de mim" },
              ...REGIONS,
              { id: "all", name: "Todos" },
            ].map((i) => (
              <button
                key={i.id}
                onClick={() => {
                  setRegion(i.id);
                  setOnlySaved(false);
                }}
                aria-pressed={!onlySaved && region === i.id}
              >
                {i.id === "auto" && <Navigation size={14} />}
                <span>{i.name}</span>
              </button>
            ))}
          </div>
          <label className="search-field beach-search">
            <Search size={18} />
            <input
              aria-label="Buscar praia"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Encontre uma praia…"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Limpar busca de praia"
              >
                ×
              </button>
            )}
          </label>
        </div>
        {region === "auto" && !onlySaved && !outOfRange && (
          <p className="catalog-context">
            {near
              ? "Ordenadas pela proximidade da sua origem. Distâncias em linha reta; veja o percurso nos detalhes."
              : "Escolha seu ponto de partida para descobrir as praias próximas."}
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
              Sua origem está fora das regiões do catálogo. Escolha Caraíva,
              Arraial d’Ajuda ou Porto Seguro para explorar.
            </p>
            <button
              className="button button-primary"
              onClick={() => setRegion("all")}
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
                    {getTourPhotos(place).length > 1 && <span className="card-photo-count"><Images size={13}/>{getTourPhotos(place).length} fotos</span>}
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
                      onClick={() => toggle(place)}
                    >
                      <Bookmark
                        size={18}
                        fill={saved[place.id] ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                  <div className="beach-card-body">
                    <span className="beach-card-region">{place.location?.split(",")[0]}</span>
                    <h3><button type="button" className="beach-card-open" onClick={() => open(place)} aria-label={`Ver detalhes de ${place.title}`}>{place.title}</button></h3>
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
                    <span className="beach-details" aria-hidden="true">Ver detalhes <ArrowUpRight size={17} /></span>
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
                    : "Nenhum lugar com esse nome"}
                </h3>
                <p>
                  {onlySaved
                    ? "Toque no marcador de uma praia para salvar o passeio."
                    : "Tente outro nome ou escolha outra região."}
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
    </div>
  );
}
