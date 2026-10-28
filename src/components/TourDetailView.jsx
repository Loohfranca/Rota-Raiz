import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Waves,
  MapPin,
  Bookmark,
  ArrowUpRight,
  Coffee,
} from "lucide-react";
import { hasCoordinates } from "../lib/walking";
import AccessGuide from "./AccessGuide";
import PhotoGallery from "./PhotoGallery";
import { getSavedTours, toggleSaveTourOffline } from "../lib/supabase";
export default function TourDetailView({
  tour,
  home,
  onBack,
  onOpenMapWithTour,
  onSwitchToRoute,
  onSaveTour,
}) {
  const [saved, setSaved] = useState(() => !!getSavedTours()[tour?.id]),
    [error, setError] = useState("");
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tour?.id]);
  const [saving,setSaving] = useState(false);
  if (!tour) return null;
  const toggle = async () => {
    if(saving)return;setSaving(true);
    try {
      if(!saved && onSaveTour && !(await onSaveTour(tour))) return;
      setSaved(toggleSaveTourOffline(tour.id, { ...tour, savedOrigin: home }));
      setError("");
    } catch {
      setError("Não foi possível salvar neste aparelho.");
    } finally {setSaving(false);}
  };
  return (
    <div className="tour-detail">
      <div className="detail-topbar">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={18} />
          Voltar aos lugares
        </button>
        <button
          className={`button button-secondary ${saved ? "is-saved" : ""}`}
          disabled={saving}
          onClick={toggle}
          aria-pressed={saved}
        >
          <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
          {saved ? "Passeio salvo" : "Salvar passeio"}
        </button>
        {saved && onSaveTour && <button className="small-action" onClick={()=>onSaveTour(tour)}>Adicionar à viagem</button>}
      </div>
      <PhotoGallery
        key={tour.id}
        tour={tour}
        onOpenMap={() => {
          if (hasCoordinates(tour)) onOpenMapWithTour(tour);
          else
            window.open(
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tour.address || `${tour.title}, ${tour.location}`)}`,
              "_blank",
              "noopener,noreferrer",
            );
        }}
      />
      <header className="detail-intro">
        <p className="eyebrow">
          <MapPin size={14} />
          {tour.location}
        </p>
        <h1>{tour.title}</h1>
        <p className="detail-description">
          {tour.description || tour.subtitle}
        </p>
        <div className="detail-highlights">
          {tour.highlights?.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </header>
      <div className="detail-columns">
        <div className="detail-main">
          <AccessGuide
            key={`${home?.lat},${home?.lng}:${tour.id}`}
            home={home}
            tour={tour}
            onSwitchToRoute={onSwitchToRoute}
          />
        </div>
        <aside className="detail-aside">
          <section className="travel-note tide-note">
            <span className="note-icon">
              <Waves size={23} />
            </span>
            <p className="eyebrow">Antes de sair</p>
            <h2>
              {tour.category === "Cultura"
                ? "Antes de visitar"
                : "De olho na maré"}
            </h2>
            <p>
              {tour.category === "Cultura"
                ? "Confira horários de visita, acessibilidade e eventuais ingressos antes de sair."
                : tour.tide_note ||
                  "Consulte a maré e os acessos antes de sair."}
            </p>
            {tour.category !== "Cultura" && (
              <a
                href="https://www.marinha.mil.br/chm/dados-do-segnav-publicacoes/tabuas-das-mares"
                target="_blank"
                rel="noopener noreferrer"
              >
                Consultar a tábua <ArrowUpRight size={16} />
              </a>
            )}
          </section>
          <section className="travel-note">
            <span className="note-icon">
              <Coffee size={23} />
            </span>
            <h2>Por lá, você encontra</h2>
            <p>
              {tour.facilities ||
                tour.access_note ||
                "Confira a estrutura e o acesso antes da visita."}
            </p>
          </section>
        </aside>
      </div>
      {error && (
        <p role="alert" className="inline-notice">
          {error}
        </p>
      )}
    </div>
  );
}
