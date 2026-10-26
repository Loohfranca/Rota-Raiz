import React, { useEffect, useRef, useState } from "react";
import { MapPin, ArrowUpRight } from "lucide-react";
import BeachPhoto from "./BeachPhoto";
import { getTourPhotos } from "../lib/photos";

const PHRASES = ["Encontre sua próxima praia.", "Descubra novos caminhos.", "Vá no seu ritmo."];

export default function ExploreHero({ destinations, visible = true, onSelect }) {
  const root = useRef(null), touch = useRef(null), swiped = useRef(false);
  const [paused, setPaused] = useState(false), [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false), [inView, setInView] = useState(true),
    [pageVisible, setPageVisible] = useState(true), [reduced, setReduced] = useState(true),
    [index, setIndex] = useState(0), [failed, setFailed] = useState([]),
    [typing, setTyping] = useState({ phrase: 0, count: PHRASES[0].length, deleting: false });
  const slides = destinations.slice(0, 5).map(tour => ({ tour, photo: getTourPhotos(tour).find(photo => !failed.includes(photo.url)) }));
  const activeIndex = index % Math.max(slides.length, 1);
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
    if (!running || slides.length < 2) return;
    const timer = setInterval(() => setIndex(value => value + 1), 7000);
    return () => clearInterval(timer);
  }, [running, slides.length]);

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
  const active = slides[activeIndex];
  if (!active) return null;
  const { tour, photo } = active;
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
      <button type="button" className="beach-photo hero-beach-photo hero-slideshow hero-destination-open" aria-label={`Explorar ${tour.title}, ${tour.location}`} onClick={event => { if (event.detail === 0 || !swiped.current) onSelect?.(tour); swiped.current = false; }}
        onTouchStart={event => { swiped.current = false; touch.current = event.touches[0]?.clientX; }} onTouchCancel={() => { touch.current = null; }} onTouchEnd={event => {
          if (touch.current == null) return;
          const delta = (event.changedTouches[0]?.clientX ?? touch.current) - touch.current;
          touch.current = null;
          if (Math.abs(delta) > 45 && slides.length > 1) { swiped.current = true; choose((activeIndex + (delta < 0 ? 1 : -1) + slides.length) % slides.length); }
        }}>
        {photo ? <img key={photo.url} className="hero-slide-image" src={photo.url} alt={photo.caption || tour.title} onError={() => setFailed(previous => [...previous, photo.url])} draggable="false" /> : <BeachPhoto tour={{ title: tour.title }} className="hero-fallback-photo" />}
        <span className="hero-photo-label"><MapPin size={15} /><span>{tour.title}<small>{tour.location}</small></span><ArrowUpRight size={17} /></span>
      </button>
      <div className="hero-carousel-controls">
        {slides.length > 1 && <div className="hero-photo-dots" role="group" aria-label="Escolher destino em destaque">{slides.map((slide, n) => <button key={slide.tour.id} aria-label={`Ver destino ${n + 1}: ${slide.tour.title}`} aria-pressed={n === activeIndex} onClick={() => choose(n)}><span /></button>)}</div>}
        {!reduced && <button className="hero-motion-toggle" onClick={() => setPaused(value => !value)} aria-label={paused ? "Retomar animações do destaque" : "Pausar animações do destaque"}>{paused ? "Retomar" : "Pausar"}</button>}
      </div>
    </div>
  </section>;
}
