import React, { useEffect, useState } from "react";
import { getRecommendations } from "../lib/community";
import { nearestRegion } from "../lib/nearby";
import { normalizeText } from "../lib/router";
export default function CommunitySuggestions({ home, onRoute }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let live = true;
    getRecommendations()
      .then((r) => {
        if (live) setItems(r.items);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  const city = nearestRegion(home)?.name;
  const filtered = items
    .filter((i) => !city || normalizeText(i.city).includes(normalizeText(city)))
    .slice(0, 6);
  if (!filtered.length) return null;
  return (
    <section className="explore-community">
      <span className="eyebrow">DICAS DE VIAJANTES</span>
      <h2>Da comunidade{city ? ` em ${city}` : ""}</h2>
      <div className="recommendation-grid">
        {filtered.map((i) => (
          <article className="recommendation" key={i.id}>
            <span>
              {i.category} · {i.city}
            </span>
            <h3>{i.name}</h3>
            <p>{i.note}</p>
            <small>{i.address}</small>
            <button
              className="small-action"
              onClick={() =>
                onRoute({
                  name: `${i.name}, ${i.address}, ${i.city}`,
                  route_by_name: true,
                })
              }
            >
              Como chegar
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
