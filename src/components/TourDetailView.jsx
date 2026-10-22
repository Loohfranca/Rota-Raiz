import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  Check, 
  Sun, 
  Star, 
  MapPin, 
  Waves, 
  Clock, 
  Bus, 
  Coins, 
  Route, 
  Lightbulb, 
  Download, 
  CheckCircle2, 
  Map,
  X,
  AlertTriangle,
  Compass,
  Footprints,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { toggleSaveTourOffline, getOfflineStorage } from '../lib/supabase';

export default function TourDetailView({
  tour,
  onBack,
  onOpenMapWithTour,
  onSwitchToRoute
}) {
  const { tours: savedTours } = getOfflineStorage();
  const [isSavedOffline, setIsSavedOffline] = useState(savedTours.includes(tour?.id));
  const [isBookmarked, setIsBookmarked] = useState(true);
  const [copiedShare, setCopiedShare] = useState(false);

  if (!tour) return null;

  const imageUrl = tour.image_url || tour.imageUrl;
  const photoAlt = tour.photo_alt || tour.photoAlt || tour.title;
  const expenseRange = tour.expense_range || tour.expenseRange || 'R$ 30 - R$ 38 ida e volta';
  const tidePeak = tour.tide_peak || tour.tidePeak || '10:45 (0.3m)';
  const tideWindow = tour.tide_window || tour.tideWindow || 'Ideal na maré baixa (< 0.4m)';
  const lastReturn = tour.last_return_transport || tour.lastReturnVan || '16:20 (última van)';
  const backpackTips = tour.backpack_tips || tour.backpackTips || [];
  const steps = tour.steps || [
    {
      step: 1,
      title: 'Transporte Regional até a Parada Mais Próxima',
      cost: 'Econômico',
      desc: 'Consulte os horários da van ou ônibus da Águia Azul no planejador de rotas.',
    }
  ];

  const handleToggleOffline = () => {
    const nextSaved = toggleSaveTourOffline(tour.id);
    setIsSavedOffline(nextSaved);

    if (nextSaved) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#2f5d3a', '#c2461f', '#e9b62f']
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${tour.title} — Rota Raiz`,
        text: `Como chegar em ${tour.title} de transporte regional raiz gastando pouco!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pb-8 gap-4">
      {/* Top contextual navigation bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          aria-label="Voltar para Passeios"
          className="min-h-[44px] px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold text-[#201b15] bg-[#ffffff] border border-[#e0d5c1] hover:bg-[#f7ece2] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Voltar</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-[#59413b] uppercase tracking-wider">
            Passeio Raiz
          </span>
          <span className="font-headline font-bold text-sm text-[#201b15]">
            Detalhe do Destino
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleShare}
            aria-label="Compartilhar rota"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#ffffff] border border-[#e0d5c1] text-[#201b15] hover:bg-[#f7ece2] transition-colors"
          >
            {copiedShare ? <Check size={16} className="text-[#2f5d3a]" /> : <Share2 size={16} />}
          </button>

          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            aria-label="Favoritar"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#ffffff] border border-[#e0d5c1] text-[#c2461f] hover:bg-[#f7ece2] transition-colors"
          >
            <Bookmark size={16} className={isBookmarked ? 'fill-current' : ''} />
          </button>
        </div>
      </div>

      {/* Hero Media Card */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-xs border border-[#e0d5c1] bg-[#f7ece2]">
        <img
          src={imageUrl}
          alt={photoAlt}
          className="w-full h-64 sm:h-72 object-cover"
        />

        {/* Overlay Badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-between p-4">
          <div className="flex items-center justify-between w-full">
            <div className={`
              inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs backdrop-blur-md
              ${isSavedOffline ? 'bg-[#2f5d3a] text-white' : 'bg-black/60 text-white'}
            `}>
              <CheckCircle2 size={14} />
              <span>{isSavedOffline ? 'Salvo no Dispositivo' : 'Offline Pronto'}</span>
            </div>

            {tour.temperature && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/90 text-[#201b15] backdrop-blur-md text-xs font-bold shadow-xs">
                <Sun size={14} className="text-[#e9b62f]" />
                <span>{tour.temperature}</span>
              </div>
            )}
          </div>

          <div className="flex items-end justify-between">
            <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg">
              {tour.location}
            </span>
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-white text-xs">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="font-bold">{tour.rating || '4.9'}</span>
              <span className="text-white/80">({tour.reviews_count || tour.reviewsCount || 100})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Title & Geo Badges */}
      <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[#ffffff] border border-[#e0d5c1]">
        <div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-[#201b15]">
            {tour.title}
          </h1>
          <p className="text-xs text-[#59413b] flex items-center gap-1 mt-1 font-medium">
            <MapPin size={15} className="text-[#c2461f]" />
            <span>{tour.location}</span>
          </p>
        </div>

        {/* Chips Row */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#bbefc1] text-[#00210b]">
            {tour.entry_fee === 0 || !tour.entry_fee ? 'Entrada Gratuita (R$ 0)' : `Entrada: R$ ${tour.entry_fee}`}
          </span>
          {tour.tide_dependent && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#ffdf9b] text-[#251a00] flex items-center gap-1">
              <Waves size={13} />
              <span>Maré Baixa Obrigatória</span>
            </span>
          )}
        </div>
      </div>

      {/* Practical Conditions Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#ffffff] border border-[#e0d5c1] shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#f7ece2]">
          <div className="flex items-center gap-2">
            <Waves size={18} className="text-[#c2461f]" />
            <span className="font-headline font-bold text-sm text-[#201b15]">
              Condições Práticas & Tábua de Maré
            </span>
          </div>
          <span className="text-xs text-[#59413b] font-medium">
            Horários de Campo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Maré */}
          <div className="p-3 rounded-xl bg-[#fdf2e7] border border-[#e0d5c1] flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#59413b] uppercase">Pico da Maré Baixa</span>
            <span className="font-headline font-bold text-sm text-[#201b15]">{tidePeak}</span>
            <span className="text-[11px] font-bold text-[#6f5300] bg-[#ffdf9b] px-2 py-0.5 rounded-md w-fit">
              {tideWindow}
            </span>
          </div>

          {/* Última Volta */}
          <div className="p-3 rounded-xl bg-[#fdf2e7] border border-[#e0d5c1] flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#59413b] uppercase">Último Transporte de Retorno</span>
            <span className="font-headline font-bold text-sm text-[#c2461f]">{lastReturn}</span>
            <span className="text-[11px] font-bold text-white bg-[#c2461f] px-2 py-0.5 rounded-md w-fit">
              Atenção ao horário
            </span>
          </div>

          {/* Gasto Transporte */}
          <div className="p-3 rounded-xl bg-[#fdf2e7] border border-[#e0d5c1] flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#59413b] uppercase">Gasto em Transporte Raiz</span>
            <span className="font-headline font-bold text-sm text-[#2f5d3a]">{expenseRange}</span>
            <span className="text-[11px] text-[#59413b]">
              Estimativa ida e volta
            </span>
          </div>
        </div>
      </div>

      {/* Como Chegar no Bolso Section */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#ffffff] border border-[#e0d5c1] shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#f7ece2]">
          <div className="flex items-center gap-2">
            <Route size={18} className="text-[#c2461f]" />
            <h2 className="font-headline font-bold text-base text-[#201b15]">
              Como Chegar de Transporte Público
            </h2>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#bbefc1] text-[#00210b]">
            Econômico
          </span>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-3">
          {steps.map((st, i) => (
            <div key={i} className="flex gap-3 relative pb-3 last:pb-0">
              <div className="flex flex-col items-center">
                <div className={`
                  w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0
                  ${i === 0 ? 'bg-[#2f5d3a]' : 'bg-[#c2461f]'}
                `}>
                  {st.step || (i + 1)}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-0.5 grow bg-[#e0d5c1] my-1 min-h-[30px]" />
                )}
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-headline font-bold text-sm text-[#201b15]">
                    {st.title}
                  </span>
                  <span className="text-xs font-bold text-[#c2461f]">
                    {st.cost}
                  </span>
                </div>
                <p className="text-xs text-[#59413b] mt-0.5 leading-relaxed">
                  {st.desc}
                </p>
                {st.warning && (
                  <div className="mt-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-[#ffdbd1] text-[#c2461f] w-fit">
                    <Coins size={12} />
                    <span>{st.warning}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onSwitchToRoute(tour.title)}
          type="button"
          className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-bold bg-[#c2461f] hover:bg-[#a02e06] text-white shadow-xs transition-colors"
        >
          <Route size={16} />
          <span>Traçar Rota no Planejador para {tour.title}</span>
        </button>
      </div>

      {/* Dicas de Mochileiro Raiz */}
      {backpackTips.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#ffffff] border border-[#e0d5c1] shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#f7ece2]">
            <Lightbulb size={18} className="text-[#e9b62f]" />
            <h2 className="font-headline font-bold text-base text-[#201b15]">
              Dicas de Mochileiro Raiz
            </h2>
          </div>

          <div className="flex flex-col gap-2.5">
            {backpackTips.map((tip, i) => (
              <div 
                key={i}
                className="p-3.5 rounded-xl bg-[#fdf2e7] border border-[#e0d5c1] flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-[#ffdf9b] text-[#251a00] flex items-center justify-center shrink-0">
                  <Lightbulb size={16} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-headline font-bold text-sm text-[#201b15]">
                    {tip.title}
                  </span>
                  <p className="text-xs text-[#59413b] mt-0.5 leading-relaxed">
                    {tip.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Buttons */}
      <section className="flex flex-col sm:flex-row gap-2.5 mt-2">
        <button
          onClick={handleToggleOffline}
          type="button"
          className="flex-1 min-h-[48px] rounded-xl bg-[#2f5d3a] hover:bg-[#22502e] text-white flex items-center justify-center gap-2 text-xs font-bold shadow-xs transition-transform active:scale-[0.98]"
        >
          {isSavedOffline ? <Check size={18} /> : <Download size={18} />}
          <span>{isSavedOffline ? 'Salvo no Dispositivo (Modo Offline)' : 'Baixar Guia Offline'}</span>
        </button>

        <button
          onClick={() => onOpenMapWithTour(tour)}
          type="button"
          className="flex-1 min-h-[48px] rounded-xl bg-[#ffffff] hover:bg-[#f7ece2] text-[#201b15] border border-[#e0d5c1] flex items-center justify-center gap-2 text-xs font-bold transition-colors"
        >
          <Map size={18} className="text-[#c2461f]" />
          <span>Ver Localização no Mapa</span>
        </button>
      </section>
    </div>
  );
}
