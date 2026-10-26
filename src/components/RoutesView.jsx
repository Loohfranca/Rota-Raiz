import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowUpDown,
  Navigation,
  ArrowRight,
  Clock,
  Coins,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Bus,
  Ship,
  Footprints,
} from "lucide-react";
import { getStops, getLegs, getPlaces, getCities } from "../lib/supabase";
import { calculateRoute, resolvePoint } from "../lib/router";
import PlaceInput from "./PlaceInput";
import PageHeading from "./PageHeading";
import AirportJourney from "./AirportJourney";
import { getAirportJourney } from "../data/airportJourney";
import JourneyLookup from "./JourneyLookup";
import AirportAccess from "./AirportAccess";
import { AIRPORTS } from "../data/travelNetwork";

const MODE_LABEL = {
  ferry: "Balsa",
  van: "Van",
  bus: "Ônibus",
  canoe: "Canoa",
  boat: "Barco",
  walk: "A pé",
};

const ModeIcon = ({ mode, size = 16 }) => {
  const cls = "shrink-0";
  if (mode === "ferry" || mode === "canoe" || mode === "boat")
    return <Ship size={size} className={cls} />;
  if (mode === "walk") return <Footprints size={size} className={cls} />;
  return <Bus size={size} className={cls} />;
};

const formatMoney = (v) =>
  v == null
    ? "Consultar valor"
    : Number(v) === 0
      ? "Grátis"
      : `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

export default function RoutesView({
  origin,
  onChangeOrigin,
  initialDestination,
  onSelectRoute,
  onNavigateToAdmin,
}) {
  const [stops, setStops] = useState([]);
  const [legs, setLegs] = useState([]);
  const [places, setPlaces] = useState([]);
  const [cities, setCities] = useState([]);

  const [dest, setDest] = useState(null);
  const [journeyRequest, setJourneyRequest] = useState(null);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("fastest");
  const [formError, setFormError] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const [s, l, p, c] = await Promise.all([
        getStops(),
        getLegs(),
        getPlaces(),
        getCities(),
      ]);
      setStops(s);
      setLegs(l);
      setPlaces(p);
      setCities(c);
    }
    load();
  }, []);

  // Destino enviado por outra tela (Mapa ou Passeios)
  useEffect(() => {
    if (initialDestination) {
      setDest(
        typeof initialDestination === "string"
          ? { name: initialDestination }
          : initialDestination,
      );
      setResult(null);
    }
  }, [initialDestination]);

  // Qualquer mudança nos campos limpa o resultado antigo
  const changeOrigin = (v) => {
    onChangeOrigin(v);
    setResult(null);
    setFormError("");
  };
  const changeDest = (v) => {
    setDest(v);
    setResult(null);
    setFormError("");
  };

  const handleSwap = () => {
    const prevOrigin = origin;
    onChangeOrigin(dest);
    setDest(prevOrigin);
    setResult(null);
  };

  const handleGps = () => {
    if (!navigator.geolocation) {
      setFormError("Seu navegador não tem GPS.");
      return;
    }
    setGpsLoading(true);
    setFormError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        changeOrigin({
          name: "Minha localização",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "gps",
        });
      },
      () => {
        setGpsLoading(false);
        setFormError(
          "Não consegui pegar sua localização. Verifique a permissão do GPS.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const runCalculation = (o, d) => {
    if (!o?.name?.trim() || !d?.name?.trim()) {
      setFormError("Preencha de onde você sai e para onde vai.");
      return;
    }
    setFormError("");
    const journey = getAirportJourney(o, d);
    setResult(
      journey
        ? { curated: journey }
        : calculateRoute(o, d, stops, legs, places, cities),
    );
    setMode("fastest");
    setJourneyRequest({ origin: { ...o }, destination: { ...d } });
  };

  // Destinos reais que saem direto da origem escolhida (vindos dos trechos cadastrados)
  const nextDestinations = useMemo(() => {
    const r = resolvePoint(origin, stops, places, cities);
    if (!r?.exact) return [];
    const seen = new Set();
    const list = [];
    legs
      .filter((l) => l.from_stop_id === r.stop.id)
      .forEach((l) => {
        if (seen.has(l.to_stop_id)) return;
        const to = stops.find((s) => s.id === l.to_stop_id);
        if (!to) return;
        seen.add(l.to_stop_id);
        list.push({ leg: l, to });
      });
    return list.slice(0, 4);
  }, [origin, stops, legs, places, cities]);

  const pickNext = ({ to }) => {
    const point = {
      name: to.name,
      lat: to.lat,
      lng: to.lng,
      stopId: to.id,
      source: "local",
    };
    setDest(point);
    runCalculation(origin, point);
  };

  const option = result?.found
    ? mode === "cheapest" && result.alternativeRoute
      ? result.alternativeRoute
      : result.primaryRoute
    : null;

  const openDetails = () => {
    if (!option) return;
    onSelectRoute({
      ...result,
      selectedOption: option,
      legs: option.legs,
      steps: option.steps,
      totalTime: option.totalTime,
      totalCost: option.totalCostFormatted,
      polylineCoords: option.polylineCoords,
    });
  };

  return (
    <div className="routes-page">
      <PageHeading
        eyebrow="De um lugar ao outro"
        title="Como chegar"
        description="Escolha sua origem e seu próximo destino."
      />
      <div className="routes-layout">
        <div className="routes-primary">
          <section
            className="route-search-card"
            aria-label="Escolha sua viagem"
          >
            <div className="route-form-actions">
              <button type="button" onClick={handleGps} disabled={gpsLoading}>
                <Navigation size={16} />
                {gpsLoading ? "Localizando…" : "Usar localização"}
              </button>
              <button
                type="button"
                onClick={handleSwap}
                aria-label="Inverter origem e destino"
              >
                <ArrowUpDown size={16} />
                Inverter
              </button>
            </div>
            <div className="route-fields">
              <PlaceInput
                label="Origem"
                value={origin}
                onChange={changeOrigin}
                placeholder="Endereço, bairro ou cidade de saída"
                stops={stops}
                places={[...places, ...AIRPORTS]}
                cities={cities}
                accent="#c2461f"
              />

              <PlaceInput
                label="Destino"
                value={dest}
                onChange={changeDest}
                placeholder="Endereço, praia, aeroporto ou cidade"
                stops={stops}
                places={[...places, ...AIRPORTS]}
                cities={cities}
                accent="#2f5d3a"
              />
            </div>

            {formError && (
              <p className="text-sm text-[#ba1a1a] flex items-center gap-1.5">
                <AlertCircle size={16} className="shrink-0" />
                {formError}
              </p>
            )}

            <button
              type="button"
              onClick={() => runCalculation(origin, dest)}
              className="w-full min-h-[52px] rounded-xl bg-[#c2461f] hover:bg-[#a02e06] text-white flex items-center justify-center gap-2 font-bold text-base active:scale-[0.99]"
            >
              Ver como ir
              <ArrowRight size={18} />
            </button>
          </section>
        </div>
        <div className="routes-results">
          {result && <AirportAccess origin={origin} destination={dest} />}
          {result?.curated && <AirportJourney journey={result.curated} />}
          {/* Resultado */}
          {result && result.found && option && (
            <section className="p-4 rounded-2xl bg-white border-2 border-[#c2461f] shadow-md flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-headline font-bold text-lg leading-snug">
                <span className="text-[#201b15]">{result.originName}</span>
                <ArrowRight size={16} className="text-[#c2461f] shrink-0" />
                <span className="text-[#c2461f]">{result.destName}</span>
              </div>

              {result.alternativeRoute && (
                <div className="grid grid-cols-2 gap-1 bg-[#f7ece2] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMode("fastest")}
                    className={`min-h-[44px] rounded-lg text-sm font-bold ${
                      mode === "fastest"
                        ? "bg-[#c2461f] text-white"
                        : "text-[#59413b]"
                    }`}
                  >
                    Mais rápida
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("cheapest")}
                    className={`min-h-[44px] rounded-lg text-sm font-bold ${
                      mode === "cheapest"
                        ? "bg-[#2f5d3a] text-white"
                        : "text-[#59413b]"
                    }`}
                  >
                    Mais barata
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                <span className="flex items-center gap-1 text-[#c2461f]">
                  <Clock size={15} />
                  {option.totalTime}
                </span>
                <span className="flex items-center gap-1 text-[#2f5d3a]">
                  <Coins size={15} />
                  {option.totalCostFormatted}
                </span>
                {option.hasUnconfirmed ? (
                  <span className="ml-auto px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs flex items-center gap-1 border border-amber-300">
                    <ShieldAlert size={13} /> Não confirmado
                  </span>
                ) : (
                  <span className="ml-auto px-2.5 py-1 rounded-full bg-[#bbefc1] text-[#00210b] text-xs flex items-center gap-1">
                    <ShieldCheck size={13} /> Confirmado
                  </span>
                )}
              </div>

              <ol className="flex flex-col gap-2">
                {option.steps.map((step) => (
                  <li
                    key={step.number}
                    className="p-3 rounded-xl bg-[#fdf2e7] border border-[#e0d5c1] flex gap-3"
                  >
                    <span className="w-7 h-7 rounded-full bg-[#c2461f] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {step.number}
                    </span>
                    <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-sm text-[#201b15] flex items-center gap-1.5">
                          <ModeIcon mode={step.mode} />
                          {step.title}
                        </span>
                        <span className="text-sm font-bold shrink-0">
                          {step.priceFormatted}
                        </span>
                      </div>
                      <span className="text-xs text-[#59413b]">
                        <strong>Pegar:</strong> {step.pickupName}
                      </span>
                      <span className="text-xs text-[#59413b]">
                        <strong>Descer:</strong> {step.dropoffName}
                      </span>
                      <span className="text-xs text-[#59413b]">
                        {step.durationFormatted}
                        {step.frequency ? ` · ${step.frequency}` : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>

              <button
                type="button"
                onClick={openDetails}
                className="w-full min-h-[48px] rounded-xl bg-[#2f5d3a] text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                Ver etapas e guardar roteiro
                <ArrowRight size={16} />
              </button>
            </section>
          )}

          {result &&
            !result.found &&
            !result.curated &&
            result.reason !== "same" && (
              <JourneyLookup origin={origin} destination={dest} uncovered />
            )}
          {result?.reason === "same" && (
            <p role="status" className="journey-context">
              Escolha um destino diferente da sua origem.
            </p>
          )}
          {result && (result.found || result.curated) && (
            <JourneyLookup origin={origin} destination={dest} />
          )}

          {!result && !nextDestinations.length && (
            <section className="route-welcome">
              <span className="note-icon">
                <Ship size={28} />
              </span>
              <p className="eyebrow">A conexão certa</p>
              <h2>
                Menos dúvida.
                <br />
                Mais viagem.
              </h2>
              <p>
                Informe um endereço, bairro ou cidade em cada campo. Os
                resultados seguem os pontos que você escolher.
              </p>
              <div className="transport-legend">
                <span>
                  <Bus size={18} />
                  Van e ônibus
                </span>
                <span>
                  <Ship size={18} />
                  Balsa e canoa
                </span>
                <span>
                  <Footprints size={18} />A pé
                </span>
              </div>
            </section>
          )}
          {/* Sugestões vindas dos dados cadastrados */}
          {!result && nextDestinations.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-headline font-bold text-base text-[#201b15] px-1">
                Saindo de {origin?.name}
              </h2>
              {nextDestinations.map((item) => (
                <button
                  key={item.leg.id}
                  type="button"
                  onClick={() => pickNext(item)}
                  className="text-left p-3.5 rounded-2xl bg-white border border-[#e0d5c1] active:border-[#c2461f] flex items-center gap-3 min-h-[64px]"
                >
                  <span className="w-9 h-9 rounded-full bg-[#ffdf9b] flex items-center justify-center shrink-0 text-[#251a00]">
                    <ModeIcon mode={item.leg.transport_mode} />
                  </span>
                  <span className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-sm text-[#201b15] truncate">
                      {item.to.name}
                    </span>
                    <span className="text-xs text-[#59413b]">
                      {MODE_LABEL[item.leg.transport_mode] || "Transporte"} ·{" "}
                      {item.leg.duration_min} min ·{" "}
                      {formatMoney(item.leg.min_price)}
                    </span>
                  </span>
                  <ArrowRight size={16} className="text-[#59413b] shrink-0" />
                </button>
              ))}
            </section>
          )}
        </div>
      </div>
      {journeyRequest && (
        <JourneyLookup
          origin={journeyRequest.origin}
          destination={journeyRequest.destination}
          defaultOpen
          hideTrigger
          onClose={() => setJourneyRequest(null)}
        />
      )}
      {onNavigateToAdmin && (
        <button
          type="button"
          onClick={onNavigateToAdmin}
          className="self-center min-h-[44px] px-3 text-xs text-[#59413b] underline"
        >
          Área do administrador
        </button>
      )}
    </div>
  );
}
