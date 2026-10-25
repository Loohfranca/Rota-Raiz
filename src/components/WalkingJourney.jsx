import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigation, MapPin } from "lucide-react";
import PlaceInput from "./PlaceInput";
import WalkingPanel from "./WalkingPanel";
import { searchPlacesOnline } from "../lib/geocode";
import { hasCoordinates } from "../lib/walking";

export default function WalkingJourney({
  origin,
  destination,
  search = searchPlacesOnline,
  RoutePanel = WalkingPanel,
}) {
  const lookup = useRef(null);
  const [from, setFrom] = useState(origin);
  const [to, setTo] = useState(destination);
  const [candidates, setCandidates] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    lookup.current = controller;
    let active = true;
    const missing = [
      ["from", origin],
      ["to", destination],
    ].filter(([, p]) => !hasCoordinates(p) && p?.name);
    if (missing.length) {
      setLoading(true);
      Promise.all(
        missing.map(async ([key, point]) => [
          key,
          await search(point.address || point.name, controller.signal),
        ]),
      )
        .then((rows) => {
          if (active && !controller.signal.aborted)
            setCandidates(Object.fromEntries(rows));
        })
        .catch((e) => {
          if (active && !controller.signal.aborted && e.name !== "AbortError")
            setError(
              "Não foi possível localizar os endereços. Use Buscar no mapa no campo para tentar novamente.",
            );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
      controller.abort();
    };
  }, [origin, destination, search]);
  const target = useMemo(() => to && { ...to, title: to.name }, [to]);
  function change(key, point) {
    lookup.current?.abort();
    setLoading(false);
    (key === "from" ? setFrom : setTo)(point);
    setCandidates((current) => ({ ...current, [key]: [] }));
    setError("");
  }
  function locate() {
    if (!navigator.geolocation) {
      setError("GPS indisponível. Digite sua origem.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGpsLoading(false);
        change("from", {
          name: "Minha localização",
          lat: p.coords.latitude,
          lng: p.coords.longitude,
        });
      },
      () => {
        setGpsLoading(false);
        setError(
          "Não foi possível obter sua localização. Digite sua origem ou confira a permissão do GPS.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  return (
    <div className="walking-journey">
      <button className="small-action" onClick={locate} disabled={gpsLoading}>
        <Navigation size={16} />
        {gpsLoading ? "Localizando…" : "Usar minha localização"}
      </button>
      {[
        ["from", "Origem", from],
        ["to", "Destino", to],
      ].map(([key, label, point]) => (
        <div key={key}>
          <PlaceInput
            label={label}
            value={point}
            onChange={(p) => change(key, p)}
            placeholder={
              key === "from"
                ? "De onde você vai sair?"
                : "Endereço da indicação"
            }
          />
          {!hasCoordinates(point) && candidates[key]?.length > 0 && (
            <div className="walking-address-options">
              <p>
                Confirme{" "}
                {key === "from" ? "o ponto de saída" : "o lugar de chegada"}:
              </p>
              {candidates[key].map((item) => (
                <button key={item.id} onClick={() => change(key, item)}>
                  <MapPin size={17} />
                  <span>
                    <b>{item.name}</b>
                    <small>{item.address || item.subtitle}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
          {!loading &&
            candidates[key]?.length === 0 &&
            !hasCoordinates(point) && (
              <p className="field-help">
                Selecione o endereço usando Buscar no mapa. Inclua cidade e
                estado.
              </p>
            )}
        </div>
      ))}
      {loading && <p role="status">Localizando os endereços…</p>}
      {error && (
        <p role="alert" className="inline-notice">
          {error}
        </p>
      )}
      {hasCoordinates(from) && hasCoordinates(to) ? (
        <RoutePanel
          key={`${from.lat},${from.lng}:${to.lat},${to.lng}`}
          home={from}
          tour={target}
          autoCalculate
          instructionsOpen
        />
      ) : (
        <p className="field-help">
          Confirme os dois pontos para ver o percurso a pé aqui no app.
        </p>
      )}
    </div>
  );
}
