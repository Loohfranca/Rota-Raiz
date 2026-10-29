import LocalAutocomplete from "./LocalAutocomplete";
import { REGIONS } from "../lib/nearby";
import { normalizeText } from "../lib/router";
import React, { useId, useState } from "react";
import { Compass, ArrowUpRight } from "lucide-react";
import { DISCOVERY_CATEGORIES, discoveryMapsUrl } from "../lib/discoverBrazil";

export default function BrazilDiscovery({ initialCity = "", fixedCity = false, initialCategory = "attractions" }) {
  const id = useId();
  const [city, setCity] = useState(initialCity);
  const [category, setCategory] = useState(initialCategory);
  const url = discoveryMapsUrl(city, category);
  return (
    <section
      className="brazil-discovery"
      aria-label="Explorar o Brasil no Maps"
    >
      <div className="brazil-discovery-heading">
        <Compass size={22} />
        <div>
          <h2>{fixedCity ? `Mais opções em ${initialCity}` : "Explore o Brasil"}</h2>
          <p>Abre uma busca externa no Google Maps.</p>
        </div>
      </div>
      <div className="brazil-discovery-fields">
        {!fixedCity && <label htmlFor={`${id}-city`}>
          Cidade ou região
          <LocalAutocomplete label="Cidade ou região" value={city} onChange={setCity}
            items={REGIONS.filter(item => city.trim().length >= 2 && normalizeText(item.name).includes(normalizeText(city))).map(item => ({id:item.id,label:item.name}))}
            onSelect={item => setCity(item.label)} placeholder="Digite uma cidade ou região" />
        </label>}
        <label htmlFor={`${id}-kind`}>
          O que descobrir
          <select
            id={`${id}-kind`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {DISCOVERY_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        {url ? (
          <a
            className="brazil-discovery-link"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buscar no Google Maps
            <ArrowUpRight size={17} />
          </a>
        ) : (
          <button className="brazil-discovery-link" disabled>
            Buscar no Google Maps
            <ArrowUpRight size={17} />
          </button>
        )}
      </div>
      <p className="brazil-discovery-note">
        Abre os resultados no Maps. As opções e a cobertura dependem do lugar;
        os resultados não são importados para o catálogo do Rota Raiz.
      </p>
    </section>
  );
}
