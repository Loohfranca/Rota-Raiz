import React, { useState } from "react";
import {
  Bike,
  Bus,
  Car,
  Footprints,
  Plane,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import { mapsDirectionsUrl } from "../lib/mapsDirections";
import {
  JOURNEY_MODES,
  journeyIntent,
  journeyError,
  flightSearchUrl,
} from "../lib/journeyIntent";
import { AIRPORTS } from "../data/travelNetwork";
import Sheet from "./Sheet";
import WalkingJourney from "./WalkingJourney";
import OfflineMapTip from "./OfflineMapTip";
import AirportAccess from "./AirportAccess";
const icons = {
  flight: Plane,
  transit: Bus,
  walking: Footprints,
  driving: Car,
  bicycling: Bike,
};
export default function JourneyLookup(props) {
  const key = [
    props.origin?.id,
    props.origin?.name,
    props.origin?.address,
    props.origin?.lat,
    props.origin?.lng,
    props.destination?.id,
    props.destination?.name,
    props.destination?.address,
    props.destination?.lat,
    props.destination?.lng,
  ].join("|");
  return <JourneyPanel key={key} {...props} />;
}
function JourneyPanel({
  origin,
  destination,
  uncovered = false,
  modes = null,
  defaultOpen = false,
  hideTrigger = false,
  onClose,
  onResolveOrigin,
  onResolveDestination,
}) {
  const [originAirportId, setOriginAirportId] = useState("");
  const [destinationAirportId, setDestinationAirportId] = useState("");
  const original = journeyIntent(origin, destination);
  const from =
    AIRPORTS.find((a) => a.id === originAirportId) ||
    original.originAirport ||
    origin;
  const to =
    AIRPORTS.find((a) => a.id === destinationAirportId) ||
    original.destinationAirport ||
    destination;
  const intent = journeyIntent(from, to);
  const [more, setMore] = useState(false);
  const choices = JOURNEY_MODES.filter((i) =>
    modes ? modes.includes(i.mode) : more || intent.suggested.includes(i.mode),
  );
  const [open, setOpen] = useState(defaultOpen),
    [walking, setWalking] = useState(false);
  const [selected, setSelected] = useState(null);
  const activeMode = choices.some((i) => i.mode === selected)
    ? selected
    : choices[0]?.mode;
  const flight = activeMode === "flight";
  const unresolved =
    (original.originCandidates.length > 1 && !originAirportId) ||
    (original.destinationCandidates.length > 1 && !destinationAirportId);
  const error = journeyError(from, to);
  const url =
    unresolved || error
      ? null
      : flight
        ? flightSearchUrl(from, to)
        : mapsDirectionsUrl(from, to, activeMode);
  function close() {
    setOpen(false);
    onClose?.();
  }
  return (
    <section className="journey-compact">
      {!hideTrigger && (
        <button
          onClick={() => {
            setWalking(false);
            setOpen(true);
          }}
        >
          <span>
            <b>
              {uncovered ? "Consultar como chegar" : "Ver opções de trajeto"}
            </b>
            <small>Com sua origem e seu destino</small>
          </span>
          <ArrowUpRight size={20} />
        </button>
      )}
      {open && (
        <Sheet
          title={walking ? "Seu percurso a pé" : "Escolha como ir"}
          onClose={close}
        >
          {walking ? (
            <>
              <button
                className="small-action"
                onClick={() => setWalking(false)}
              >
                Voltar às opções
              </button>
              <WalkingJourney origin={from} destination={to} />
              <OfflineMapTip />
            </>
          ) : (
            <div className="maps-handoff">
              <div className="journey-context-label">
                <span>
                  {intent.intercity
                    ? "Viagem entre cidades"
                    : intent.sameCity &&
                        intent.originAirport &&
                        intent.destinationAirport
                      ? "Conexão entre terminais"
                      : "Seu próximo trajeto"}
                </span>
              </div>
              <div className="maps-handoff-points">
                {[
                  [
                    "Saída",
                    from,
                    original.originCandidates,
                    originAirportId,
                    setOriginAirportId,
                    onResolveOrigin,
                  ],
                  [
                    "Chegada",
                    to,
                    original.destinationCandidates,
                    destinationAirportId,
                    setDestinationAirportId,
                    onResolveDestination,
                  ],
                ].map(
                  ([label, point, candidates, value, setValue, onResolved]) => (
                    <div key={label}>
                      <small>{label}</small>
                      <p>{point?.name}</p>
                      {candidates.length > 1 && (
                        <label className="airport-choice">
                          <span>
                            {label === "Saída"
                              ? "Aeroporto de saída"
                              : "Aeroporto de chegada"}
                          </span>
                          <select
                            aria-label={
                              label === "Saída"
                                ? "Aeroporto de saída"
                                : "Aeroporto de chegada"
                            }
                            value={value}
                            onChange={(e) => {
                              setValue(e.target.value);
                              const airport = AIRPORTS.find(
                                (a) => a.id === e.target.value,
                              );
                              if (airport) onResolved?.(airport);
                            }}
                          >
                            <option value="">Escolha o aeroporto</option>
                            {candidates.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.title}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                  ),
                )}
              </div>
              {unresolved && (
                <p role="status" className="journey-choice-help">
                  Há mais de um aeroporto nessa cidade. Escolha o terminal para
                  continuar.
                </p>
              )}
              <div
                className="maps-mode-picker"
                role="group"
                aria-label="Meio de transporte"
              >
                {choices.map(({ mode, label }) => {
                  const Icon = icons[mode];
                  return (
                    <button
                      type="button"
                      key={mode}
                      className={mode === "flight" ? "flight-option" : ""}
                      aria-pressed={activeMode === mode}
                      onClick={() => setSelected(mode)}
                    >
                      <Icon size={20} />
                      <span>{label}</span>
                      {mode === "flight" && intent.intercity && (
                        <small>Comparar voos</small>
                      )}
                    </button>
                  );
                })}
              </div>
              {!modes && (
                <button
                  className="journey-more-modes"
                  aria-expanded={more}
                  onClick={() => setMore(!more)}
                >
                  {more ? "Recolher outras opções" : "Outras formas de ir"}
                  <ChevronDown size={15} />
                </button>
              )}
              {error && (
                <p role="alert" className="inline-notice">
                  {error}
                </p>
              )}
              {url && (
                <a
                  className="maps-continue"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {flight
                    ? "Pesquisar voos no Google"
                    : "Continuar no Google Maps"}
                  <ArrowUpRight size={19} />
                </a>
              )}
              <p className="maps-handoff-help">
                {flight
                  ? "A pesquisa leva sua origem e seu destino. Escolha as datas e confira aeroportos, conexões e preços no serviço externo. O app não consulta voos ao vivo."
                  : "Sua origem, seu destino e o transporte já vão preenchidos. A disponibilidade do percurso é confirmada no Google Maps."}
              </p>
              {flight && (
                <div className="flight-connection-note">
                  <Plane size={19} />
                  <p>
                    <b>O voo é uma parte do caminho.</b> Planeje também como
                    chegar ao terminal de saída e sair do aeroporto na chegada.
                  </p>
                </div>
              )}
              {flight && <AirportAccess origin={from} destination={to} />}
              {activeMode === "walking" && !unresolved && !error && (
                <button
                  className="maps-internal-walk"
                  onClick={() => setWalking(true)}
                >
                  <Footprints size={17} />
                  Ver caminhada aqui no Rota Raiz
                </button>
              )}
              <OfflineMapTip />
            </div>
          )}
        </Sheet>
      )}
    </section>
  );
}
