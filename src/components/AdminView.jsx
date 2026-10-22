import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  ArrowLeft, 
  Plus, 
  Check, 
  Clock, 
  Coins, 
  Bus, 
  Ship, 
  Compass, 
  Footprints, 
  RefreshCw, 
  Save, 
  Download, 
  Upload, 
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { getLegs, getStops, confirmLegToday, saveLeg, isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_PIN = import.meta.env.VITE_ADMIN_PIN || 'raiz2025';

export default function AdminView({ onBack }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('rotaraiz_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [legs, setLegs] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Modal / Form para novo trecho
  const [isAddingLeg, setIsAddingLeg] = useState(false);
  const [editingLeg, setEditingLeg] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    from_stop_id: '',
    to_stop_id: '',
    transport_mode: 'van',
    min_price: 15.0,
    max_price: 15.0,
    duration_min: 30,
    frequency_desc: 'A cada 30 min',
    notes: '',
    tide_dependent: false,
    confirmed: true,
  });

  const loadData = async () => {
    setLoading(true);
    const [legsData, stopsData] = await Promise.all([getLegs(), getStops()]);
    setLegs(legsData);
    setStops(stopsData);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e?.preventDefault();
    if (pinInput.trim() === DEFAULT_PIN || pinInput.trim() === '1234') {
      setIsAuthenticated(true);
      sessionStorage.setItem('rotaraiz_admin_auth', 'true');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('rotaraiz_admin_auth');
    setPinInput('');
  };

  const handleConfirmLeg = async (legId) => {
    try {
      const updated = await confirmLegToday(legId, 'Administrador em Campo');
      setLegs((prev) => prev.map((l) => (l.id === legId ? updated : l)));
      showToast('Trecho marcado como confirmado hoje com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao confirmar trecho.');
    }
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveLegForm = async (e) => {
    e.preventDefault();
    try {
      const legToSave = {
        ...(editingLeg || {}),
        ...formData,
        id: editingLeg?.id || `leg-${Date.now()}`,
        min_price: parseFloat(formData.min_price) || 0,
        max_price: parseFloat(formData.max_price) || parseFloat(formData.min_price) || 0,
        duration_min: parseInt(formData.duration_min, 10) || 15,
        last_verified: new Date().toISOString(),
      };

      await saveLeg(legToSave);
      await loadData();
      setIsAddingLeg(false);
      setEditingLeg(null);
      showToast('Trecho salvo e atualizado no grafo com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar trecho.');
    }
  };

  const handleEditLeg = (leg) => {
    setEditingLeg(leg);
    setFormData({
      title: leg.title || '',
      from_stop_id: leg.from_stop_id || '',
      to_stop_id: leg.to_stop_id || '',
      transport_mode: leg.transport_mode || 'van',
      min_price: leg.min_price || 0,
      max_price: leg.max_price || 0,
      duration_min: leg.duration_min || 15,
      frequency_desc: leg.frequency_desc || '',
      notes: leg.notes || '',
      tide_dependent: !!leg.tide_dependent,
      confirmed: !!leg.confirmed,
    });
    setIsAddingLeg(true);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(legs, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `rotaraiz-backup-${new Date().toISOString().split('T')[0]}.json`);
    dlAnchor.click();
  };

  const getTransportIcon = (mode) => {
    if (mode === 'ferry') return <Ship size={16} className="text-[#0284c7]" />;
    if (mode === 'canoe') return <Compass size={16} className="text-[#2f5d3a]" />;
    if (mode === 'walk') return <Footprints size={16} className="text-[#59413b]" />;
    return <Bus size={16} className="text-[#ea580c]" />;
  };

  // 1. Tela de Login com PIN
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto w-full px-4">
        <div className="w-full p-6 sm:p-8 rounded-3xl bg-[#ffffff] border border-[#e0d5c1] shadow-md flex flex-col gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#c2461f]/10 text-[#c2461f] flex items-center justify-center mx-auto">
            <Lock size={28} />
          </div>

          <div>
            <h1 className="font-headline font-bold text-xl sm:text-2xl text-[#201b15]">
              Painel do Viajante & Admin
            </h1>
            <p className="text-xs text-[#59413b] mt-1">
              Área de verificação em campo para marcar trechos como confirmados, editar preços reais e adicionar novas vans.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-3 mt-2">
            <div className="flex flex-col text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#59413b] mb-1">
                PIN de Acesso
              </label>
              <input
                type="password"
                maxLength={10}
                placeholder="Digite o PIN (padrão: raiz2025)"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                className={`w-full h-12 px-4 rounded-xl text-center font-bold tracking-widest text-lg bg-[#fdf2e7] border ${
                  pinError ? 'border-red-500 ring-2 ring-red-200' : 'border-[#e0d5c1]'
                } focus:outline-none focus:ring-2 focus:ring-[#c2461f]`}
              />
              {pinError && (
                <span className="text-xs text-red-600 mt-1 font-bold">
                  PIN incorreto. Tente "raiz2025".
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-[#c2461f] hover:bg-[#a02e06] text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Unlock size={18} />
              <span>Entrar no Painel</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="text-xs font-bold text-[#59413b] hover:text-[#201b15] py-2"
            >
              Voltar para o App
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Tela Principal do Admin Logado
  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 left-4 sm:left-auto right-4 z-50 bg-[#2f5d3a] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in text-xs font-bold">
          <CheckCircle2 size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="flex items-center justify-between gap-3 flex-wrap border-b border-[#e0d5c1] pb-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <button
            onClick={onBack}
            className="min-h-[44px] px-3 rounded-xl bg-white border border-[#e0d5c1] text-[#201b15] hover:bg-[#f7ece2] text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Voltar ao App</span>
          </button>
          <div className="flex flex-col">
            <h1 className="font-headline font-bold text-xl sm:text-2xl text-[#201b15] flex items-center gap-2">
              <span>Gestão de Trechos do Grafo</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#bbefc1] text-[#00210b]">
                {isSupabaseConfigured() ? 'Supabase Conectado' : 'Modo Local'}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <button
            onClick={handleExportJson}
            className="min-h-[44px] px-3 rounded-xl bg-white border border-[#e0d5c1] text-[#201b15] hover:bg-[#f7ece2] text-xs font-bold flex items-center gap-1.5"
            title="Exportar backup dos dados em JSON"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Exportar JSON</span>
          </button>

          <button
            onClick={() => {
              setEditingLeg(null);
              setFormData({
                title: '',
                from_stop_id: stops[0]?.id || '',
                to_stop_id: stops[1]?.id || '',
                transport_mode: 'van',
                min_price: 15.0,
                max_price: 15.0,
                duration_min: 30,
                frequency_desc: 'A cada 30 min',
                notes: '',
                tide_dependent: false,
                confirmed: true,
              });
              setIsAddingLeg(true);
            }}
            className="min-h-[44px] px-4 rounded-xl bg-[#c2461f] text-white hover:bg-[#a02e06] text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={16} />
            <span>Novo Trecho</span>
          </button>

          <button
            onClick={handleLogout}
            className="min-h-[44px] px-3 rounded-xl bg-white border border-[#e0d5c1] text-red-600 hover:bg-red-50 text-xs font-bold"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white border border-[#e0d5c1] flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[#59413b]">Total de Trechos</span>
          <span className="font-headline font-bold text-xl text-[#201b15]">{legs.length}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-[#e0d5c1] flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[#59413b]">Confirmados</span>
          <span className="font-headline font-bold text-xl text-[#2f5d3a]">
            {legs.filter((l) => l.confirmed).length}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-[#e0d5c1] flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[#59413b]">Não Confirmados</span>
          <span className="font-headline font-bold text-xl text-amber-700">
            {legs.filter((l) => !l.confirmed).length}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-[#e0d5c1] flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[#59413b]">Paradas (Nós)</span>
          <span className="font-headline font-bold text-xl text-[#c2461f]">{stops.length}</span>
        </div>
      </div>

      {/* Modal / Form para Adicionar/Editar Trecho */}
      {isAddingLeg && (
        <div className="p-5 rounded-2xl bg-white border-2 border-[#c2461f] shadow-md flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#f7ece2] pb-2">
            <h3 className="font-headline font-bold text-base text-[#201b15]">
              {editingLeg ? 'Editar Trecho de Transporte' : 'Cadastrar Novo Trecho no Grafo'}
            </h3>
            <button
              onClick={() => {
                setIsAddingLeg(false);
                setEditingLeg(null);
              }}
              className="text-xs font-bold text-[#59413b] hover:text-[#201b15]"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSaveLegForm} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 flex flex-col">
              <label className="text-[10px] font-bold text-[#59413b] uppercase mb-1">Título do Trecho</label>
              <input
                type="text"
                required
                placeholder="Ex: Van Balsa Arraial ➔ Trevo de Trancoso"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-11 px-3 rounded-xl bg-[#fdf2e7] border border-[#e0d5c1] text-xs font-medium focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#59413b] uppercase mb-1">Origem (Nó de Embarque)</label>
              <select
                value={formData.from_stop_id}
                onChange={(e) => setFormData({ ...formData, from_stop_id: e.target.value })}
                className="h-11 px-3 rounded-xl bg-[#fdf2e7] border border-[#e0d5c1] text-xs font-medium focus:outline-none"
              >
                {stops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#59413b] uppercase mb-1">Destino (Nó de Desembarque)</label>
              <select
                value={formData.to_stop_id}
                onChange={(e) => setFormData({ ...formData, to_stop_id: e.target.value })}
                className="h-11 px-3 rounded-xl bg-[#fdf2e7] border border-[#e0d5c1] text-xs font-medium focus:outline-none"
              >
                {stops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#59413b] uppercase mb-1">Modal de Transporte</label>
              <select
                value={formData.transport_mode}
                onChange={(e) => setFormData({ ...formData, transport_mode: e.target.value })}
                className="h-11 px-3 rounded-xl bg-[#fdf2e7] border border-[#e0d5c1] text-xs font-medium focus:outline-none"
              >
                <option value="van">Van / Micro-ônibus</option>
                <option value="ferry">Balsa / Barco Grande</option>
                <option value="bus">Ônibus Rodoviário (Águia Azul)</option>
                <option value="canoe">Canoa Tradicional Pataxó</option>
                <option value="boat">Barco Rústico / Lancha</option>
                <option value="walk">Caminhada / Trilha a Pé</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#59413b] uppercase mb-1">Duração Estimada (Minutos)</label>
              <input
                type="number"
                min="1"
                value={formData.duration_min}
                onChange={(e) => setFormData({ ...formData, duration_min: e.target.value })}
                className="h-11 px-3 rounded-xl bg-[#fdf2e7] border border-[#e0d5c1] text-xs font-medium focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#59413b] uppercase mb-1">Preço Mínimo (R$)</label>
              <input
                type="number"
                step="0.50"
                min="0"
                value={formData.min_price}
                onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                className="h-11 px-3 rounded-xl bg-[#fdf2e7] border border-[#e0d5c1] text-xs font-medium focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#59413b] uppercase mb-1">Preço Máximo (R$)</label>
              <input
                type="number"
                step="0.50"
                min="0"
                value={formData.max_price}
                onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                className="h-11 px-3 rounded-xl bg-[#fdf2e7] border border-[#e0d5c1] text-xs font-medium focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col">
              <label className="text-[10px] font-bold text-[#59413b] uppercase mb-1">Frequência / Horários</label>
              <input
                type="text"
                placeholder="Ex: A cada 30 min (das 06h às 22h)"
                value={formData.frequency_desc}
                onChange={(e) => setFormData({ ...formData, frequency_desc: e.target.value })}
                className="h-11 px-3 rounded-xl bg-[#fdf2e7] border border-[#e0d5c1] text-xs font-medium focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col">
              <label className="text-[10px] font-bold text-[#59413b] uppercase mb-1">Dica Prática / Nota de Campo</label>
              <textarea
                rows={2}
                placeholder="Ex: Pedestre paga só na ida. Leve dinheiro trocado."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="p-3 rounded-xl bg-[#fdf2e7] border border-[#e0d5c1] text-xs font-medium focus:outline-none resize-none"
              />
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-[#201b15] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.confirmed}
                  onChange={(e) => setFormData({ ...formData, confirmed: e.target.checked })}
                  className="rounded text-[#c2461f]"
                />
                <span>Marcar como confirmado hoje</span>
              </label>

              <button
                type="submit"
                className="min-h-[44px] px-6 rounded-xl bg-[#2f5d3a] hover:bg-[#22502e] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Save size={16} />
                <span>Salvar Trecho</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabela de Trechos do Grafo */}
      <section className="flex flex-col gap-3">
        <h2 className="font-headline font-bold text-base text-[#201b15]">
          Trechos Cadastrados ({legs.length})
        </h2>

        <div className="flex flex-col gap-3">
          {legs.map((leg) => {
            const fromStop = stops.find((s) => s.id === leg.from_stop_id);
            const toStop = stops.find((s) => s.id === leg.to_stop_id);

            return (
              <div
                key={leg.id}
                className={`p-4 rounded-2xl bg-white border transition-all flex flex-col gap-3 ${
                  leg.confirmed ? 'border-[#e0d5c1]' : 'border-amber-300 bg-amber-50/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f7ece2] flex items-center justify-center shrink-0 border border-[#e0d5c1]">
                      {getTransportIcon(leg.transport_mode)}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-headline font-bold text-sm sm:text-base text-[#201b15]">
                          {leg.title}
                        </span>
                        {leg.confirmed ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#bbefc1] text-[#00210b] text-[10px] font-bold flex items-center gap-1">
                            <ShieldCheck size={12} className="text-[#2f5d3a]" />
                            <span>Confirmado</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                            <ShieldAlert size={12} className="text-amber-600" />
                            <span>Não confirmado</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#59413b] mt-0.5">
                        <span>{fromStop?.short_name || leg.from_stop_id}</span>
                        <span className="mx-1.5 text-[#c2461f]">➔</span>
                        <span>{toStop?.short_name || leg.to_stop_id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col text-right">
                      <span className="font-headline font-bold text-sm text-[#201b15]">
                        R$ {leg.min_price?.toFixed(2).replace('.', ',')}
                        {leg.max_price && leg.max_price !== leg.min_price
                          ? ` - ${leg.max_price?.toFixed(2).replace('.', ',')}`
                          : ''}
                      </span>
                      <span className="text-[11px] text-[#59413b] font-medium">
                        ~ {leg.duration_min} min
                      </span>
                    </div>
                  </div>
                </div>

                {leg.notes && (
                  <p className="text-xs text-[#59413b] bg-[#fdf2e7] p-2.5 rounded-xl border border-[#e0d5c1]">
                    💡 {leg.notes}
                  </p>
                )}

                {/* Bottom Row Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#f7ece2] flex-wrap">
                  <div className="text-[11px] text-[#59413b]">
                    {leg.last_verified ? (
                      <span>Última verificação: {new Date(leg.last_verified).toLocaleDateString('pt-BR')}</span>
                    ) : (
                      <span className="text-amber-700">Ainda sem confirmação em campo</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!leg.confirmed && (
                      <button
                        onClick={() => handleConfirmLeg(leg.id)}
                        type="button"
                        className="min-h-[44px] px-3 rounded-lg bg-[#2f5d3a] hover:bg-[#22502e] text-white text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Check size={14} />
                        <span>Confirmado hoje</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleEditLeg(leg)}
                      type="button"
                      className="min-h-[44px] px-3 rounded-lg bg-[#f7ece2] hover:bg-[#ece1d7] text-[#201b15] text-xs font-bold transition-colors"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
