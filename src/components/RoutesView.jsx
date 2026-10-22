import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowRight,
  Clock,
  Coins,
  AlertCircle,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  Bus,
  Ship,
  Footprints,
} from 'lucide-react';
import { getStops, getLegs, getPlaces, getCities } from '../lib/supabase';
import { calculateRoute, resolvePoint } from '../lib/router';
import PlaceInput from './PlaceInput';
import PageHeading from './PageHeading';

const MODE_LABEL = { ferry: 'Balsa', van: 'Van', bus: 'Ônibus', canoe: 'Canoa', boat: 'Barco', walk: 'A pé' };

const ModeIcon = ({ mode, size = 16 }) => {
  const cls = 'shrink-0';
  if (mode === 'ferry' || mode === 'canoe' || mode === 'boat') return <Ship size={size} className={cls} />;
  if (mode === 'walk') return <Footprints size={size} className={cls} />;
  return <Bus size={size} className={cls} />;
};

const formatMoney = (v) => (v ? `R$ ${Number(v).toFixed(2).replace('.', ',')}` : 'Grátis');

export default function RoutesView({ origin, onChangeOrigin, initialDestination, onSelectRoute, onNavigateToAdmin }) {
  const [stops, setStops] = useState([]);
  const [legs, setLegs] = useState([]);
  const [places, setPlaces] = useState([]);
  const [cities, setCities] = useState([]);

  const [dest, setDest] = useState(null);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState('fastest');
  const [formError, setFormError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const [s, l, p, c] = await Promise.all([getStops(), getLegs(), getPlaces(), getCities()]);
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
      setDest({ name: initialDestination });
      setResult(null);
    }
  }, [initialDestination]);

  // Qualquer mudança nos campos limpa o resultado antigo
  const changeOrigin = (v) => {
    onChangeOrigin(v);
    setResult(null);
    setFormError('');
  };
  const changeDest = (v) => {
    setDest(v);
    setResult(null);
    setFormError('');
  };

  const handleSwap = () => {
    const prevOrigin = origin;
    onChangeOrigin(dest);
    setDest(prevOrigin);
    setResult(null);
  };

  const handleGps = () => {
    if (!navigator.geolocation) {
      setFormError('Seu navegador não tem GPS.');
      return;
    }
    setGpsLoading(true);
    setFormError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        changeOrigin({
          name: 'Minha localização',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: 'gps',
        });
      },
      () => {
        setGpsLoading(false);
        setFormError('Não consegui pegar sua localização. Verifique a permissão do GPS.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const runCalculation = (o, d) => {
    if (!o?.name?.trim() || !d?.name?.trim()) {
      setFormError('Preencha de onde você sai e para onde vai.');
      return;
    }
    setFormError('');
    setResult(calculateRoute(o, d, stops, legs, places, cities));
    setMode('fastest');
  };

  // Usa o ponto cadastrado mais próximo no lugar do que foi digitado
  const useNearestStop = () => {
    if (!result?.nearestStop) return;
    const s = result.nearestStop;
    const point = { name: s.name, lat: s.lat, lng: s.lng, stopId: s.id, source: 'local' };
    if (result.side === 'origin') {
      onChangeOrigin(point);
      runCalculation(point, dest);
    } else {
      setDest(point);
      runCalculation(origin, point);
    }
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
    const point = { name: to.name, lat: to.lat, lng: to.lng, stopId: to.id, source: 'local' };
    setDest(point);
    runCalculation(origin, point);
  };

  const option = result?.found
    ? mode === 'cheapest' && result.alternativeRoute
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

  const startersFromData = cities.slice(0, 6);

  return (
    <div className="routes-page">
      <PageHeading eyebrow="De um lugar ao outro" title="A viagem começa" accent="no caminho." description="Encontre as conexões de van, ônibus, balsa e canoa."/>
      <div className="routes-layout"><div className="routes-primary">
      <section className="route-search-card">
        <div className="relative flex flex-col gap-2.5">
          <PlaceInput
            label="De onde você sai"
            value={origin}
            onChange={changeOrigin}
            placeholder="Digite um lugar ou use o GPS"
            stops={stops}
            places={places}
            cities={cities}
            accent="#c2461f"
            onGps={handleGps}
            gpsLoading={gpsLoading}
          />

          <div className="flex justify-center -my-1.5 relative z-10">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Inverter origem e destino"
              className="w-11 h-11 rounded-full bg-[#f7ece2] text-[#201b15] flex items-center justify-center border border-[#e0d5c1] shadow-xs active:rotate-180 transition-transform"
            >
              <ArrowUpDown size={18} />
            </button>
          </div>

          <PlaceInput
            label="Para onde você vai"
            value={dest}
            onChange={changeDest}
            placeholder="Praia, cidade, rodoviária..."
            stops={stops}
            places={places}
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

      </div><div className="routes-results">
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
                onClick={() => setMode('fastest')}
                className={`min-h-[44px] rounded-lg text-sm font-bold ${
                  mode === 'fastest' ? 'bg-[#c2461f] text-white' : 'text-[#59413b]'
                }`}
              >
                Mais rápida
              </button>
              <button
                type="button"
                onClick={() => setMode('cheapest')}
                className={`min-h-[44px] rounded-lg text-sm font-bold ${
                  mode === 'cheapest' ? 'bg-[#2f5d3a] text-white' : 'text-[#59413b]'
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
                    <span className="text-sm font-bold shrink-0">{step.priceFormatted}</span>
                  </div>
                  <span className="text-xs text-[#59413b]">
                    <strong>Pegar:</strong> {step.pickupName}
                  </span>
                  <span className="text-xs text-[#59413b]">
                    <strong>Descer:</strong> {step.dropoffName}
                  </span>
                  <span className="text-xs text-[#59413b]">
                    {step.durationFormatted}
                    {step.frequency ? ` · ${step.frequency}` : ''}
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

      {result && !result.found && (
        <section className="p-4 rounded-2xl bg-white border border-amber-300 shadow-xs flex flex-col gap-3">
          <div className="flex items-start gap-2 text-amber-800">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <h2 className="font-headline font-bold text-base leading-snug">
              {result.reason === 'no-coverage'
                ? 'Ainda não temos rotas por aí'
                : result.reason === 'unknown'
                ? 'Não encontrei esse lugar'
                : result.reason === 'same'
                ? 'Origem e destino iguais'
                : 'Ainda não temos essa rota'}
            </h2>
          </div>
          <p className="text-sm text-[#59413b] leading-relaxed">{result.message}</p>

          {result.reason === 'no-coverage' && result.nearestStop && (
            <>
              <p className="text-sm text-[#59413b]">
                O ponto cadastrado mais perto é <strong>{result.nearestStop.name}</strong>, a ~
                {Math.round(result.nearestKm)} km em linha reta.
              </p>
              <button
                type="button"
                onClick={useNearestStop}
                className="min-h-[48px] px-4 rounded-xl bg-[#c2461f] text-white font-bold text-sm"
              >
                Usar esse ponto
              </button>
            </>
          )}

          {(result.reason === 'no-route' || result.reason === 'no-coverage') && onNavigateToAdmin && (
            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="min-h-[44px] px-4 rounded-xl bg-[#f7ece2] text-[#c2461f] font-bold text-sm flex items-center justify-center gap-1.5 border border-[#e0d5c1] self-start"
            >
              <PlusCircle size={16} />
              Cadastrar este trecho
            </button>
          )}
        </section>
      )}

      {!result && !nextDestinations.length && <section className="route-welcome"><span className="note-icon"><Ship size={28}/></span><p className="eyebrow">A conexão certa</p><h2>Menos dúvida.<br/>Mais viagem.</h2><p>Escolha a origem e o destino para consultar os trechos cadastrados e os locais de embarque.</p><div className="transport-legend"><span><Bus size={18}/>Van e ônibus</span><span><Ship size={18}/>Balsa e canoa</span><span><Footprints size={18}/>A pé</span></div></section>}
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
                <span className="font-bold text-sm text-[#201b15] truncate">{item.to.name}</span>
                <span className="text-xs text-[#59413b]">
                  {MODE_LABEL[item.leg.transport_mode] || 'Transporte'} · {item.leg.duration_min} min ·{' '}
                  {formatMoney(item.leg.min_price)}
                </span>
              </span>
              <ArrowRight size={16} className="text-[#59413b] shrink-0" />
            </button>
          ))}
        </section>
      )}

      {!result && !origin?.name && startersFromData.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-headline font-bold text-base text-[#201b15] px-1">Comece por aqui</h2>
          <div className="flex flex-wrap gap-2">
            {startersFromData.map((c) => {
              const s = stops.find((st) => st.city_id === c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    changeOrigin({ name: c.name, lat: c.lat, lng: c.lng, stopId: s?.id || null, source: 'local' })
                  }
                  className="min-h-[44px] px-4 rounded-full bg-white border border-[#e0d5c1] text-sm font-bold text-[#201b15]"
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </section>
      )}

      </div></div>
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
