import React, { useEffect, useRef, useState } from "react";
import { MapPin, Pause, Play } from "lucide-react";
import BeachPhoto from "./BeachPhoto";
import { getTourPhotos } from "../lib/photos";

const PHRASES = ["Encontre sua próxima praia.", "Descubra novos caminhos.", "Vá no seu ritmo."];

export default function ExploreHero({ tour, visible = true }) {
  const root = useRef(null), touch = useRef(null);
  const [paused, setPaused] = useState(false), [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false), [inView, setInView] = useState(true),
    [pageVisible, setPageVisible] = useState(true), [reduced, setReduced] = useState(true),
    [index, setIndex] = useState(0), [failed, setFailed] = useState([]),
    [typing, setTyping] = useState({ phrase: 0, count: PHRASES[0].length, deleting: false });
  const photos = getTourPhotos(tour).filter(photo => !failed.includes(photo.url)).slice(0, 3);
  const activeIndex = index % Math.max(photos.length, 1);
  const running = visible && pageVisible && inView && !reduced && !paused && !hovered && !focused;

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(media?.matches ?? true);
    const visibility = () => setPageVisible(!document.hidden);
    motion(); visibility();
    media?.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    const observer = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([entry]) => setInView(entry.isIntersecting)) : null;
    if (root.current) observer?.observe(root.current);
    return () => {
      media?.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!running || photos.length < 2) return;
    const timer = setInterval(() => setIndex(value => value + 1), 7000);
    return () => clearInterval(timer);
  }, [running, photos.length]);

  useEffect(() => {
    if (!running) return;
    const phrase = PHRASES[typing.phrase];
    const delay = !typing.deleting && typing.count === phrase.length ? 3200 : typing.deleting ? 38 : 85;
    const timer = setTimeout(() => setTyping(current => {
      if (!current.deleting && current.count === PHRASES[current.phrase].length) return { ...current, deleting: true };
      if (current.deleting && current.count === 0) return { phrase: (current.phrase + 1) % PHRASES.length, count: 0, deleting: false };
      return { ...current, count: current.count + (current.deleting ? -1 : 1) };
    }), delay);
    return () => clearTimeout(timer);
  }, [running, typing]);

  const choose = next => { setIndex(next); setPaused(true); };
  const active = photos[activeIndex];
  return <section ref={root} className="explore-hero explore-hero-interactive"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className="explore-intro">
      <p className="eyebrow"><span className="tiny-line" />Seu próximo destino</p>
      <h1>Menos pressa.<br /><span>Mais descobertas.</span></h1>
      <p className="explore-type-line"><span className="sr-only">Encontre sua próxima praia. Descubra novos caminhos. Vá no seu ritmo.</span><span aria-hidden="true">{reduced || paused ? PHRASES[typing.phrase] : PHRASES[typing.phrase].slice(0, typing.count)}<span className={`type-cursor ${running ? "is-running" : ""}`} /></span></p>
      <p className="explore-hero-description">Escolha um lugar. A gente ajuda com o caminho.</p>
    </div>
    <div className="hero-landscape">
      <div className="beach-photo hero-beach-photo hero-slideshow" onTouchStart={event => { touch.current = event.touches[0]?.clientX; }} onTouchEnd={event => {
        if (touch.current == null) return;
        const delta = (event.changedTouches[0]?.clientX ?? touch.current) - touch.current;
        touch.current = null;
        if (Math.abs(delta) > 45 && photos.length > 1) choose((activeIndex + (delta < 0 ? 1 : -1) + photos.length) % photos.length);
      }}>
        {active ? <img key={active.url} className={running ? "hero-slide-image is-running" : "hero-slide-image"} src={active.url} alt={active.caption || tour.title} onError={() => setFailed(previous => [...previous, active.url])} draggable="false" /> : <BeachPhoto tour={tour} className="hero-fallback-photo" />}
      </div>
      <div className="hero-photo-label"><MapPin size={15} /><span>{tour.title}<small>{tour.location?.split(",")[0]}</small></span></div>
      {!reduced && <button className="hero-motion-toggle" onClick={() => setPaused(value => !value)} aria-label={paused ? "Retomar animações do destaque" : "Pausar animações do destaque"}>{paused ? <Play size={15} /> : <Pause size={15} />}</button>}
      {photos.length > 1 && <div className="hero-photo-dots" role="group" aria-label={`Fotos de ${tour.title}`}>{photos.map((photo, n) => <button key={photo.url} aria-label={`Ver foto ${n + 1} de ${tour.title}`} aria-pressed={n === activeIndex} onClick={() => choose(n)}><span /></button>)}</div>}
    </div>
  </section>;
}
