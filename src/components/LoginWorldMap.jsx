import React, { useEffect, useRef, useState } from "react";
import { LocateFixed, Minus, Pause, Play, Plus } from "lucide-react";
import { LOGIN_WORLD_COUNTRIES } from "../data/loginWorldPaths";
import "./LoginWorldMap.css";

/**
 * Mapa plano decorativo e interativo da tela de entrada.
 * Não consulta localização do usuário e não interfere na sessão Supabase.
 */
export default function LoginWorldMap() {
  const zoneRef = useRef(null);
  const stageRef = useRef(null);
  const controlsRef = useRef(null);
  const playingRef = useRef(true);
  const [playing, setPlaying] = useState(true);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    const zone = zoneRef.current;
    const stage = stageRef.current;
    if (!zone || !stage) return undefined;

    const pointers = new Map();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let panX = 0;
    let panY = 0;
    let zoom = 1;
    let autoX = 0;
    let autoY = 0;
    let phase = 0;
    let lastTime = 0;
    let pauseUntil = 0;
    let frame = 0;
    let dragging = false;
    let tappedCountry = null;
    let downX = 0;
    let downY = 0;

    const stageWidth = () => (window.innerWidth < 720
      ? Math.max(820, window.innerWidth * 2.05)
      : Math.max(1280, window.innerWidth * 1.16));
    const bounds = () => {
      const width = stageWidth() * zoom;
      const height = width / 2;
      return {
        x: Math.max(0, (width - window.innerWidth) / 2 - 12),
        y: Math.max(36, (height - window.innerHeight * 0.62) / 2 + 28),
      };
    };
    const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));
    const limitPan = () => {
      const b = bounds();
      panX = clamp(panX, b.x);
      panY = clamp(panY, b.y);
    };
    const updateStageSize = () => {
      stage.style.width = stageWidth() + "px";
      limitPan();
    };
    const suspendMotion = (delay = 6000) => {
      // Preserve the current position before giving control to the user.
      panX += autoX;
      panY += autoY;
      autoX = 0;
      autoY = 0;
      phase = 0;
      pauseUntil = performance.now() + delay;
      limitPan();
    };
    const zoomBy = (factor) => {
      suspendMotion();
      zoom = Math.max(0.78, Math.min(2.6, zoom * factor));
      limitPan();
    };
    const reset = () => {
      suspendMotion();
      panX = 0;
      panY = 0;
      zoom = 1;
      setSelected("");
    };

    const render = (time) => {
      const dt = Math.min(0.05, Math.max(0, (time - lastTime) / 1000 || 0));
      lastTime = time;
      const active = playingRef.current &&
        !reducedMotion.matches &&
        !document.hidden &&
        time > pauseUntil &&
        pointers.size === 0;
      if (active) {
        phase += dt * 0.22;
        const b = bounds();
        autoX = Math.sin(phase) * Math.min(175, b.x * 0.70);
        autoY = Math.sin(phase * 0.57) * Math.min(13, b.y * 0.22);
      }
      const b = bounds();
      const x = clamp(panX + autoX, b.x);
      const y = clamp(panY + autoY, b.y);
      stage.style.transform = `translate(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px)) scale(${zoom.toFixed(3)})`;
      frame = window.requestAnimationFrame(render);
    };

    function distance(values) {
      return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
    }
    function onDown(event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const node = event.target;
      tappedCountry = node instanceof Element ? node.closest("[data-country]")?.getAttribute("data-country") : null;
      suspendMotion();
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 1) {
        dragging = false;
        downX = event.clientX;
        downY = event.clientY;
      } else {
        dragging = true;
        tappedCountry = null;
      }
      zone.setPointerCapture(event.pointerId);
      zone.classList.add("is-dragging");
    }
    function onMove(event) {
      const previous = pointers.get(event.pointerId);
      if (!previous) return;
      const oldValues = [...pointers.values()];
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const currentValues = [...pointers.values()];
      if (pointers.size === 1) {
        panX += event.clientX - previous.x;
        panY += event.clientY - previous.y;
        if (Math.hypot(event.clientX - downX, event.clientY - downY) > 7) dragging = true;
      } else if (pointers.size >= 2) {
        const oldDistance = distance(oldValues);
        const newDistance = distance(currentValues);
        if (oldDistance > 0 && newDistance > 0) {
          zoom = Math.max(0.78, Math.min(2.6, zoom * (newDistance / oldDistance)));
        }
        const oldCenter = { x: (oldValues[0].x + oldValues[1].x) / 2, y: (oldValues[0].y + oldValues[1].y) / 2 };
        const newCenter = { x: (currentValues[0].x + currentValues[1].x) / 2, y: (currentValues[0].y + currentValues[1].y) / 2 };
        panX += newCenter.x - oldCenter.x;
        panY += newCenter.y - oldCenter.y;
        dragging = true;
      }
      limitPan();
    }
    function onUp(event) {
      if (!pointers.has(event.pointerId)) return;
      pointers.delete(event.pointerId);
      if (!dragging && tappedCountry) setSelected(tappedCountry);
      if (pointers.size === 0) zone.classList.remove("is-dragging");
      else dragging = true;
      tappedCountry = null;
    }
    function onWheel(event) {
      event.preventDefault();
      zoomBy(event.deltaY > 0 ? 0.91 : 1.09);
    }

    controlsRef.current = { zoomBy, reset, suspendMotion };
    updateStageSize();
    zone.addEventListener("pointerdown", onDown);
    zone.addEventListener("pointermove", onMove);
    zone.addEventListener("pointerup", onUp);
    zone.addEventListener("pointercancel", onUp);
    zone.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", updateStageSize);
    frame = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(frame);
      zone.removeEventListener("pointerdown", onDown);
      zone.removeEventListener("pointermove", onMove);
      zone.removeEventListener("pointerup", onUp);
      zone.removeEventListener("pointercancel", onUp);
      zone.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", updateStageSize);
      controlsRef.current = null;
    };
  }, []);

  function toggleMotion() {
    const next = !playingRef.current;
    playingRef.current = next;
    setPlaying(next);
    controlsRef.current?.suspendMotion(next ? 0 : 6000);
  }

  return (
    <>
      <div className="rr-world-zone" ref={zoneRef} aria-label="Mapa-múndi interativo. Arraste para explorar e use dois dedos para ampliar.">
        <div className="rr-world-stage" ref={stageRef}>
          <svg className="rr-world-svg" viewBox="0 0 1200 600" role="img" aria-label="Mapa plano com contornos dos países">
            <g className="rr-world-grid" aria-hidden="true">
              <path d="M0 100H1200M0 200H1200M0 300H1200M0 400H1200M0 500H1200M200 0V600M400 0V600M600 0V600M800 0V600M1000 0V600"/>
            </g>
            <g className="rr-world-countries">
              {LOGIN_WORLD_COUNTRIES.map(({ name, d }) => (
                <path key={name} data-country={name} d={d} className={selected === name ? "is-selected" : ""} />
              ))}
            </g>
          </svg>
        </div>
      </div>
      <div className="rr-map-head">
        <div className="rr-map-intro">
          <div className="rr-map-eyebrow">O mundo é feito de caminhos</div>
          <div className="rr-map-subtitle">Explore antes de começar</div>
        </div>
        <div className="rr-map-controls" aria-label="Controles do mapa">
          <button type="button" aria-label="Diminuir zoom" title="Diminuir zoom" onClick={() => controlsRef.current?.zoomBy(0.85)}><Minus size={17}/></button>
          <button type="button" aria-label="Aumentar zoom" title="Aumentar zoom" onClick={() => controlsRef.current?.zoomBy(1.18)}><Plus size={17}/></button>
          <button type="button" aria-label="Centralizar mapa" title="Centralizar mapa" onClick={() => controlsRef.current?.reset()}><LocateFixed size={17}/></button>
          <button type="button" aria-label={playing ? "Pausar movimento automático" : "Retomar movimento automático"} title={playing ? "Pausar movimento" : "Retomar movimento"} aria-pressed={playing} onClick={toggleMotion}>{playing ? <Pause size={16}/> : <Play size={16}/>}</button>
        </div>
      </div>
      {selected && <div className="rr-map-country" role="status">{selected}</div>}
      <div className="rr-map-hint">Arraste para mover · Toque nos países · Zoom com dois dedos</div>
    </>
  );
}
