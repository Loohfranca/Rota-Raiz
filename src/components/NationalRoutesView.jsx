import React, { useState } from "react";
import { ArrowRight, Bus, Clock3, MapPin, ShieldAlert, LoaderCircle, Footprints } from "lucide-react";

const durationText = (minutes) => {
  if (minutes === null || minutes === undefined) return "Tempo não informado";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? (String(h) + "h" + (m ? " " + m + "min" : "")) : String(m) + " min";
};

const fareText = (fare) => {
  if (!fare || fare.amount === null) return "Tarifa não informada";
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency", currency: fare.currency,
    }).format(fare.amount);
  } catch {
    return "Tarifa não informada";
  }
};

const timeText = (iso) => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
};

function Step({ step, index }) {
  const isTransit = step.mode === "transit";
  return (
    <li className="flex gap-3 py-3 border-b border-[#e9ddd0] last:border-0">
      <span className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center rounded-full bg-[#f7ece2] text-[#c2461f]">
        {isTransit ? <Bus size={17} /> : <Footprints size={17} />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-[#201b15]">
          {isTransit
            ? [step.vehicle, step.line].filter(Boolean).join(" · ")
            : "Caminhar"}
        </div>
        {isTransit ? (
          <>
            {step.agency && <p className="text-xs text-[#59413b]">Empresa: {step.agency}</p>}
            {step.headsign && <p className="text-xs text-[#59413b]">Sentido: {step.headsign}</p>}
            {step.from && <p className="text-xs text-[#59413b]">Embarque: {step.from}{timeText(step.departure) ? " · " + timeText(step.departure) : ""}</p>}
            {step.to && <p className="text-xs text-[#59413b]">Desembarque: {step.to}{timeText(step.arrival) ? " · " + timeText(step.arrival) : ""}</p>}
          </>
        ) : <p className="text-xs text-[#59413b]">{step.instruction}</p>}
        {step.durationMinutes !== null && <p className="text-xs text-[#8b6255]">{durationText(step.durationMinutes)}</p>}
      </div>
    </li>
  );
}

export default function NationalRoutesView() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setResult(null);
    setError("");
    if (origin.trim().length < 3 || destination.trim().length < 3) {
      setError("Escreva a cidade e o estado de origem e destino.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/rotas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível buscar as rotas.");
      setResult(data);
    } catch (err) {
      setError(err.message || "Falha na conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="routes-layout">
      <section className="routes-primary">
        <form onSubmit={submit} className="route-search-card flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[#2f5d3a] font-bold text-sm">
            <MapPin size={17} /> Descubra como chegar em qualquer cidade
          </div>
          <label htmlFor="rr-national-origin" className="text-sm font-bold text-[#201b15]">De onde você sai?</label>
          <input id="rr-national-origin" type="text" autoComplete="street-address"
            value={origin} onChange={(e) => setOrigin(e.target.value)}
            placeholder="Ex.: Centro, Salvador - BA"
            className="w-full min-h-[48px] px-4 rounded-xl border border-[#d8cabc] bg-white text-[#201b15] outline-offset-2"
            maxLength={160} required />
          <label htmlFor="rr-national-destination" className="text-sm font-bold text-[#201b15]">Para onde deseja ir?</label>
          <input id="rr-national-destination" type="text"
            value={destination} onChange={(e) => setDestination(e.target.value)}
            placeholder="Ex.: Praia do Forte, Mata de São João - BA"
            className="w-full min-h-[48px] px-4 rounded-xl border border-[#d8cabc] bg-white text-[#201b15] outline-offset-2"
            maxLength={160} required />
          <p className="text-xs text-[#59413b]">
            Pesquisa por transporte público a partir de agora. Informe bairro, cidade e estado para evitar destinos com nomes parecidos.
          </p>
          <button type="submit" disabled={loading}
            className="w-full min-h-[52px] rounded-xl bg-[#c2461f] hover:bg-[#a02e06] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <><LoaderCircle size={18} className="animate-spin" /> Consultando transportes...</> : <>Ver como ir <ArrowRight size={18} /></>}
          </button>
          {error && <p role="alert" className="text-sm text-[#a83219] flex gap-2"><ShieldAlert size={18} className="shrink-0" />{error}</p>}
        </form>
      </section>
      <section className="routes-results">
        {!result && !error && (
          <div className="route-welcome">
            <span className="note-icon"><Bus size={28} /></span>
            <p className="eyebrow">Ônibus, trem e muito mais</p>
            <h2>O próximo destino começa aqui.</h2>
            <p>Veja alternativas de transporte na mesma tela. Quando não houver dados suficientes, o Rota Raiz avisa.</p>
          </div>
        )}
        {result?.routes?.length === 0 && (
          <div className="p-4 rounded-2xl bg-white border border-amber-300 text-sm text-[#59413b]">
            Ainda não encontramos itinerários de transporte público entre esses locais nesta fonte.
            Isso não significa que não exista van, barco ou transporte local. Tente um terminal mais próximo.
          </div>
        )}
        {result?.routes?.map((route, index) => (
          <article key={index} className="p-4 mb-3 rounded-2xl bg-white border border-[#e0d5c1] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-headline font-bold text-lg text-[#201b15]">
                Opção {index + 1}
              </h2>
              <span className="flex gap-1 items-center text-sm font-bold text-[#2f5d3a]">
                <Clock3 size={16} /> {durationText(route.durationMinutes)}
              </span>
            </div>
            <div className="rounded-lg bg-[#f7ece2] p-2 text-sm text-[#59413b]">
              {fareText(route.fare)}
            </div>
            <ol>
              {route.steps.map((step, i) => <Step step={step} index={i} key={i} />)}
            </ol>
            <p className="text-xs text-[#59413b]">
              Fonte: <span translate="no">Google Maps</span>. Horários e preços podem mudar sem aviso;
              confirme a disponibilidade com a empresa antes de sair.
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}