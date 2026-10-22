import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  Coins, 
  Download, 
  CheckCircle2, 
  Map, 
  Ship, 
  Bus, 
  Compass,
  Footprints,
  Check, 
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { toggleSaveRouteOffline, getOfflineStorage } from '../lib/supabase';

export default function RouteDetailView({
  route,
  origin,
  destination,
  onBack,
  onOpenMapWithRoute
}) {
  // Dados dinâmicos ou fallback
  const originName = route?.originName || origin || 'Porto Seguro';
  const destName = route?.destName || destination || 'Caraíva';
  const routeId = route?.id || `route-${originName}-${destName}`;
  const totalTime = route?.totalTime || route?.selectedOption?.totalTime || '~ 3h 10 min';
  const totalCost = route?.totalCost || route?.selectedOption?.totalCostFormatted || 'R$ 38,00';
  const steps = route?.steps || route?.selectedOption?.steps || [];
  const hasUnconfirmed = route?.selectedOption?.hasUnconfirmed ?? true;
  const hasTideDependent = route?.selectedOption?.hasTideDependent ?? false;

  const { routes: savedRoutes } = getOfflineStorage();
  const [isSavedOffline, setIsSavedOffline] = useState(savedRoutes.includes(routeId));
  const [showBanner, setShowBanner] = useState(false);

  const handleToggleOffline = () => {
    const nextSavedState = toggleSaveRouteOffline(routeId);
    setIsSavedOffline(nextSavedState);

    if (nextSavedState) {
      setShowBanner(true);
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#c2461f', '#2f5d3a', '#e9b62f']
      });
    } else {
      setShowBanner(false);
    }
  };

  const getTransportIcon = (mode) => {
    if (mode === 'ferry') return <Ship size={18} className="text-[#0284c7]" />;
    if (mode === 'canoe') return <Compass size={18} className="text-[#2f5d3a]" />;
    if (mode === 'walk') return <Footprints size={18} className="text-[#59413b]" />;
    return <Bus size={18} className="text-[#ea580c]" />;
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pb-8 gap-4">
      {/* Offline Notification Banner */}
      {showBanner && (
        <div className="w-full bg-[#2f5d3a] text-white px-4 py-3 rounded-xl shadow-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span className="text-xs font-medium">
              Itinerário salvo no seu dispositivo. Você pode consultá-lo mesmo em áreas sem sinal de internet ou telefone.
            </span>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Header Actions */}
      <header className="flex flex-col gap-2">
        <div className="flex flex-col items-stretch sm:flex-row sm:items-center sm:justify-between gap-2">
          <button
            onClick={onBack}
            className="min-h-[44px] px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold text-[#201b15] bg-[#ffffff] border border-[#e0d5c1] hover:bg-[#f7ece2] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>

          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:flex gap-2">
            <button
              onClick={handleToggleOffline}
              className={`min-h-[44px] px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold border transition-all ${
                isSavedOffline 
                  ? 'bg-[#2f5d3a] text-white border-[#2f5d3a]' 
                  : 'bg-[#ffffff] text-[#2f5d3a] border-[#e0d5c1] hover:bg-[#f7ece2]'
              }`}
            >
              {isSavedOffline ? <Check size={16} /> : <Download size={16} />}
              <span>{isSavedOffline ? 'Salvo no Dispositivo' : 'Salvar Offline'}</span>
            </button>

            <button
              onClick={() => onOpenMapWithRoute && onOpenMapWithRoute(route)}
              className="min-h-[44px] px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold bg-[#c2461f] text-white hover:bg-[#a02e06] shadow-xs transition-all"
            >
              <Map size={16} />
              <span>Ver no Mapa</span>
            </button>
          </div>
        </div>

        {/* Route Title & Summary Card */}
        <div className="flex flex-col gap-3 mt-1 p-4 sm:p-5 rounded-2xl bg-[#ffffff] border border-[#e0d5c1] shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-headline font-bold text-xl sm:text-2xl text-[#201b15]">
              {originName}
            </span>
            <ArrowRight size={22} className="text-[#c2461f]" />
            <span className="font-headline font-bold text-xl sm:text-2xl text-[#c2461f]">
              {destName}
            </span>
          </div>

          {/* Verification & Meta Badges */}
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#f7ece2]">
            {hasUnconfirmed ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1.5 border border-amber-300">
                <ShieldAlert size={14} className="text-amber-600" />
                <span>Não confirmado hoje</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-[#bbefc1] text-[#00210b] text-xs font-bold flex items-center gap-1.5 border border-[#2f5d3a]/30">
                <ShieldCheck size={14} className="text-[#2f5d3a]" />
                <span>Confirmado hoje</span>
              </span>
            )}

            {hasTideDependent && (
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1">
                <span>🌊 Travessia na maré baixa</span>
              </span>
            )}

            <div className="flex items-center gap-3 text-xs text-[#59413b] font-medium ml-auto">
              <span className="flex items-center gap-1 font-bold text-[#c2461f]">
                <Clock size={14} />
                {totalTime}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-bold text-[#2f5d3a]">
                <Coins size={14} />
                {totalCost}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Step by Step Timeline */}
      <section className="flex flex-col gap-3">
        <h2 className="font-headline font-bold text-base text-[#201b15] px-1">
          Passo a Passo das Baldeações
        </h2>

        <div className="flex flex-col gap-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="p-4 sm:p-5 rounded-2xl bg-[#ffffff] border border-[#e0d5c1] shadow-xs flex flex-col gap-3"
            >
              {/* Step Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#c2461f] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {step.number}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 min-w-0">
                      {getTransportIcon(step.mode)}
                      <span className="font-headline font-bold text-base text-[#201b15]">
                        {step.title}
                      </span>
                    </div>
                    {step.frequency && (
                      <span className="text-xs text-[#59413b] mt-0.5">
                        {step.frequency}
                      </span>
                    )}
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-[#fdf2e7] text-[#c2461f] font-bold text-xs shrink-0 border border-[#e0d5c1]">
                  {step.priceFormatted}
                </span>
              </div>

              {/* Boarding and Drop-off info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#f7ece2]/60 p-3 rounded-xl border border-[#e0d5c1]/60">
                <div>
                  <span className="font-bold text-[#59413b] block uppercase text-[10px]">
                    Local de Embarque:
                  </span>
                  <span className="text-[#201b15] font-medium">
                    {step.pickupName}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-[#59413b] block uppercase text-[10px]">
                    Local de Desembarque:
                  </span>
                  <span className="text-[#201b15] font-medium">
                    {step.dropoffName}
                  </span>
                </div>
              </div>

              {/* Payment Methods & Verification Badge */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {step.paymentMethods?.map((pm, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[#ece1d7] text-[#201b15] text-[11px] font-medium"
                    >
                      {pm}
                    </span>
                  ))}
                </div>

                <div className="text-[11px] text-[#59413b]">
                  {step.confirmed ? (
                    <span className="text-[#2f5d3a] font-bold">✓ Confirmado em campo</span>
                  ) : (
                    <span className="text-amber-700 font-medium">⚠️ Valor estimado (sujeito a variação)</span>
                  )}
                </div>
              </div>

              {/* Practical Notes */}
              {step.notes && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <Lightbulb size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{step.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Backpack Advice Banner */}
      <section className="p-4 rounded-2xl bg-[#bbefc1]/30 border border-[#e0d5c1] flex items-start gap-3 shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-[#2f5d3a] text-white flex items-center justify-center shrink-0">
          <Lightbulb size={18} />
        </div>
        <div className="flex flex-col text-xs text-[#59413b] leading-relaxed">
          <span className="font-headline font-bold text-sm text-[#201b15] mb-0.5">
            Dica Importante de Viagem
          </span>
          Ao viajar entre Arraial d'Ajuda, Trancoso e Caraíva, o último ônibus da Águia Azul parte pontualmente às 15:45 da saída da balsa. Se perder esse horário, a única opção é contratar táxi particular ou van fretada.
        </div>
      </section>
    </div>
  );
}
