import React, { useState } from "react";
import { Bike, Bus, Car, Footprints, ArrowUpRight } from "lucide-react";
import { mapsDirectionsUrl } from "../lib/mapsDirections";
import Sheet from "./Sheet";
import WalkingJourney from "./WalkingJourney";
import OfflineMapTip from "./OfflineMapTip";

export default function JourneyLookup({
  origin,
  destination,
  uncovered = false,
  modes = null,
  defaultOpen = false,
  hideTrigger = false,
  onClose,
}) {
  const choices = [
    { mode: "transit", label: "Transporte público", Icon: Bus },
    { mode: "walking", label: "A pé", Icon: Footprints },
    { mode: "driving", label: "Carro / táxi", Icon: Car },
    { mode: "bicycling", label: "Bicicleta", Icon: Bike },
  ].filter((i) => !modes || modes.includes(i.mode));
  const [open, setOpen] = useState(defaultOpen);
  const [walking, setWalking] = useState(false);
  const [selected, setSelected] = useState(choices[0]?.mode || "transit");
  function close() {
    setOpen(false);
    onClose?.();
  }
  const activeMode = choices.some((i) => i.mode === selected)
    ? selected
    : choices[0]?.mode;
  const url = mapsDirectionsUrl(origin, destination, activeMode);
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
              <WalkingJourney origin={origin} destination={destination} />
              <OfflineMapTip />
            </>
          ) : (
            <div className="maps-handoff">
              <div className="maps-handoff-points">
                <div>
                  <small>Saída</small>
                  <p>{origin?.name}</p>
                </div>
                <div>
                  <small>Chegada</small>
                  <p>{destination?.name}</p>
                </div>
              </div>
              <div
                className="maps-mode-picker"
                role="group"
                aria-label="Meio de transporte"
              >
                {choices.map(({ mode, label, Icon }) => (
                  <button
                    type="button"
                    key={mode}
                    aria-pressed={activeMode === mode}
                    onClick={() => setSelected(mode)}
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              {url && (
                <a
                  className="maps-continue"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Continuar no Google Maps
                  <ArrowUpRight size={19} />
                </a>
              )}
              <p className="maps-handoff-help">
                Sua origem, seu destino e o transporte já vão preenchidos. O
                Google Maps mostra as opções disponíveis para o trajeto.
              </p>
              {activeMode === "walking" && (
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
