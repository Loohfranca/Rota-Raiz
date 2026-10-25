import React, { useState } from "react";
import {
  Bike,
  Bus,
  Car,
  Footprints,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";
import { mapsDirectionsUrl } from "../lib/mapsDirections";
import Sheet from "./Sheet";
import WalkingJourney from "./WalkingJourney";
export default function JourneyLookup({
  origin,
  destination,
  uncovered = false,
  modes = null,
}) {
  const [open, setOpen] = useState(false);
  const [walking, setWalking] = useState(false);
  const choices = [
    { mode: "transit", label: "Transporte público", Icon: Bus },
    { mode: "driving", label: "Carro / táxi", Icon: Car },
    { mode: "walking", label: "A pé", Icon: Footprints },
    { mode: "bicycling", label: "Bicicleta", Icon: Bike },
  ].filter((i) => !modes || modes.includes(i.mode));
  return (
    <section className="journey-compact">
      <button
        onClick={() => {
          setWalking(false);
          setOpen(true);
        }}
      >
        <span>
          <b>{uncovered ? "Consultar como chegar" : "Ver opções de trajeto"}</b>
          <small>
            {uncovered
              ? "Caminhada no app e outras opções"
              : "Com sua origem e seu destino"}
          </small>
        </span>
        <ArrowUpRight size={20} />
      </button>
      {open && (
        <Sheet
          title={walking ? "Seu percurso a pé" : "Escolha como ir"}
          onClose={() => setOpen(false)}
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
            </>
          ) : (
            <>
              <p className="journey-points">
                {origin.name} → {destination.name}
              </p>
              {uncovered && (
                <p className="field-help">
                  Ainda não há roteiro verificado no Rota Raiz para esses
                  pontos.
                </p>
              )}
              <div className="external-mode-grid">
                {choices.map(({ mode, label, Icon }) =>
                  mode === "walking" ? (
                    <button key={mode} onClick={() => setWalking(true)}>
                      <Icon size={22} />
                      <span>{label}</span>
                      <ArrowUpRight size={15} />
                    </button>
                  ) : (
                    <a
                      href={mapsDirectionsUrl(origin, destination, mode)}
                      key={mode}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon size={22} />
                      <span>{label}</span>
                      <ExternalLink size={15} />
                    </a>
                  ),
                )}
              </div>
              <p className="field-help">
                Transporte público, carro e bicicleta abrem o Google Maps.
                Disponibilidade, horários e preços dependem do serviço externo;
                não são consultados ao vivo pelo app.
              </p>
            </>
          )}
        </Sheet>
      )}
    </section>
  );
}
