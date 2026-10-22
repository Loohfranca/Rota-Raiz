import { TRAVEL_CITIES } from '../data/travelNetwork';
import { BEACHES } from '../data/beachCatalog';
import { createClient } from '@supabase/supabase-js';
import { CITIES, STOPS, OPERATORS, LEGS, PLACES } from '../data/seedData';

// Obtenção da URL e chave do Supabase
const getSupabaseConfig = () => {
  const localConfig = localStorage.getItem('rotaraiz_supabase_config');
  if (localConfig) {
    try {
      const parsed = JSON.parse(localConfig);
      if (parsed.url && parsed.key) return parsed;
    } catch (e) {
      console.error('Erro ao ler config do Supabase do localStorage', e);
    }
  }

  return {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };
};

const initialConfig = getSupabaseConfig();

export let supabase = (initialConfig.url && initialConfig.key)
  ? createClient(initialConfig.url, initialConfig.key)
  : null;

export const updateSupabaseConnection = (url, key) => {
  if (url && key) {
    localStorage.setItem('rotaraiz_supabase_config', JSON.stringify({ url, key }));
    supabase = createClient(url, key);
    return true;
  } else {
    localStorage.removeItem('rotaraiz_supabase_config');
    supabase = null;
    return false;
  }
};

export const isSupabaseConfigured = () => {
  return !!supabase;
};

// ==============================================================================
// GESTÃO DE ESTADO LOCAL & SINCRONIZAÇÃO
// ==============================================================================

// Inicialização de cache local com os dados autênticos de seed
const initLocalStorage = () => {
  if (!localStorage.getItem('rotaraiz_legs')) {
    localStorage.setItem('rotaraiz_legs', JSON.stringify(LEGS));
  }
  if (!localStorage.getItem('rotaraiz_stops')) {
    localStorage.setItem('rotaraiz_stops', JSON.stringify(STOPS));
  }
  if (!localStorage.getItem('rotaraiz_places')) {
    localStorage.setItem('rotaraiz_places', JSON.stringify(PLACES));
  }
};
initLocalStorage();

// Buscar paradas (nós)
export const getStops = async () => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('stops').select('*');
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('Erro ao consultar stops no Supabase, usando local:', e);
    }
  }
  const cached = localStorage.getItem('rotaraiz_stops');
  return cached ? JSON.parse(cached) : STOPS;
};

// Buscar trechos (arestas)
export const getLegs = async () => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('legs').select('*');
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('Erro ao consultar legs no Supabase, usando local:', e);
    }
  }
  const cached = localStorage.getItem('rotaraiz_legs');
  return cached ? JSON.parse(cached) : LEGS;
};

// Buscar atrativos / passeios
export const mergeBeachCatalog = (data = []) => {
  const map = new Map(data.filter(item => item.id !== 'caraiva-prainha').map(item => [item.id, item]));
  BEACHES.forEach(item => map.set(item.id, { ...map.get(item.id), ...item }));
  return [...map.values()];
};
export const getPlaces = async () => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('places').select('*');
      if (!error && data) {
        const merged = mergeBeachCatalog(data);
        try { localStorage.setItem('rotaraiz_places', JSON.stringify(merged)); } catch { /* consultation remains available */ }
        return merged;
      }
    } catch (e) { console.warn('Usando catálogo local:', e); }
  }
  try {
    const cached = JSON.parse(localStorage.getItem('rotaraiz_places') || 'null');
    return mergeBeachCatalog(Array.isArray(cached) ? cached : PLACES);
  } catch { return mergeBeachCatalog(PLACES); }
};

// Buscar operadores
export const getOperators = async () => {
  return OPERATORS;
};

// Buscar cidades
export const getCities = async () => {
  return [...CITIES, ...TRAVEL_CITIES];
};

// ==============================================================================
// AÇÕES DE CONFIRMAÇÃO & EDIÇÃO (ADMIN)
// ==============================================================================

// Marcar trecho como confirmado hoje
export const confirmLegToday = async (legId, verifierName = 'Viajante em Trânsito') => {
  const now = new Date().toISOString();
  
  // 1. Atualiza no cache local
  const currentLegs = await getLegs();
  const updatedLegs = currentLegs.map(leg => {
    if (leg.id === legId) {
      return {
        ...leg,
        confirmed: true,
        last_verified: now,
        verified_by: verifierName,
      };
    }
    return leg;
  });
  localStorage.setItem('rotaraiz_legs', JSON.stringify(updatedLegs));

  // 2. Se houver Supabase, persiste lá
  if (supabase) {
    try {
      await supabase
        .from('legs')
        .update({
          confirmed: true,
          last_verified: now,
          verified_by: verifierName,
        })
        .eq('id', legId);
    } catch (e) {
      console.warn('Erro ao sincronizar confirmLegToday no Supabase:', e);
    }
  }

  return updatedLegs.find(l => l.id === legId);
};

// Salvar / Atualizar trecho
export const saveLeg = async (legData) => {
  const currentLegs = await getLegs();
  const existingIdx = currentLegs.findIndex(l => l.id === legData.id);
  let updatedLegs;

  const preparedLeg = {
    ...legData,
    id: legData.id || `leg-${Date.now()}`,
    confirmed: legData.confirmed ?? false,
    last_verified: legData.confirmed ? (legData.last_verified || new Date().toISOString()) : null,
  };

  if (existingIdx >= 0) {
    updatedLegs = [...currentLegs];
    updatedLegs[existingIdx] = preparedLeg;
  } else {
    updatedLegs = [preparedLeg, ...currentLegs];
  }

  localStorage.setItem('rotaraiz_legs', JSON.stringify(updatedLegs));

  if (supabase) {
    try {
      await supabase.from('legs').upsert([preparedLeg]);
    } catch (e) {
      console.warn('Erro ao salvar trecho no Supabase:', e);
    }
  }

  return preparedLeg;
};

// ==============================================================================
// OFFLINE BOOKMARKS & FAVORITOS
// ==============================================================================
export const getOfflineStorage = () => {
  const routes = JSON.parse(localStorage.getItem('rotaraiz_saved_routes') || '[]');
  const tours = Object.keys(getSavedTours());
  return { routes, tours };
};

export const toggleSaveRouteOffline = (routeId) => {
  const { routes } = getOfflineStorage();
  let updated;
  if (routes.includes(routeId)) {
    updated = routes.filter(id => id !== routeId);
  } else {
    updated = [...routes, routeId];
  }
  localStorage.setItem('rotaraiz_saved_routes', JSON.stringify(updated));
  return updated.includes(routeId);
};

export const getSavedTours = () => {
  try { return JSON.parse(localStorage.getItem('rotaraiz_tour_details') || '{}'); } catch { return {}; }
};

export const toggleSaveTourOffline = (tourId, tour) => {
  const { tours } = getOfflineStorage();
  let updated;
  if (tours.includes(tourId)) {
    updated = tours.filter(id => id !== tourId);
  } else {
    updated = [...tours, tourId];
  }
  const details = getSavedTours();
  if (updated.includes(tourId) && tour) details[tourId] = { ...tour, savedAt: new Date().toISOString() };
  else delete details[tourId];
  localStorage.setItem('rotaraiz_tour_details', JSON.stringify(details));
  localStorage.setItem('rotaraiz_saved_tours', JSON.stringify(updated));
  return updated.includes(tourId);
};
