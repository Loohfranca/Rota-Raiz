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
export const getPlaces = async () => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('places').select('*');
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('Erro ao consultar places no Supabase, usando local:', e);
    }
  }
  const cached = localStorage.getItem('rotaraiz_places');
  return cached ? JSON.parse(cached) : PLACES;
};

// Buscar operadores
export const getOperators = async () => {
  return OPERATORS;
};

// Buscar cidades
export const getCities = async () => {
  return CITIES;
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
  const tours = JSON.parse(localStorage.getItem('rotaraiz_saved_tours') || '["espelho", "trancoso-quadrado", "caraiva-prainha", "jaqueira"]');
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

export const toggleSaveTourOffline = (tourId) => {
  const { tours } = getOfflineStorage();
  let updated;
  if (tours.includes(tourId)) {
    updated = tours.filter(id => id !== tourId);
  } else {
    updated = [...tours, tourId];
  }
  localStorage.setItem('rotaraiz_saved_tours', JSON.stringify(updated));
  return updated.includes(tourId);
};

// ==============================================================================
// AUTENTICAÇÃO COM SUPABASE + GOOGLE OAUTH
// ==============================================================================

/**
 * Fazer login com Google via Supabase
 * Retorna { user, session, error }
 */
export const signInWithGoogle = async () => {
  if (!supabase) {
    return { user: null, session: null, error: 'Supabase não está configurado' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Erro ao fazer login com Google:', error);
      return { user: null, session: null, error: error.message };
    }

    return { user: data?.user, session: data?.session, error: null };
  } catch (e) {
    console.error('Erro na autenticação Google:', e);
    return { user: null, session: null, error: e.message };
  }
};

/**
 * Fazer logout
 */
export const signOut = async () => {
  if (!supabase) return false;

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error);
      return false;
    }
    localStorage.removeItem('rotaraiz_user');
    localStorage.removeItem('rotaraiz_user_session');
    return true;
  } catch (e) {
    console.error('Erro no logout:', e);
    return false;
  }
};

/**
 * Obter usuário atualmente logado
 */
export const getCurrentUser = async () => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user;
  } catch (e) {
    console.error('Erro ao obter usuário:', e);
    return null;
  }
};

/**
 * Obter sessão atual
 */
export const getSession = async () => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      return null;
    }
    return data.session;
  } catch (e) {
    console.error('Erro ao obter sessão:', e);
    return null;
  }
};

/**
 * Listener para mudanças de estado de autenticação
 * Retorna uma função para cancelar a inscrição
 */
export const onAuthStateChanged = (callback) => {
  if (!supabase) return () => {};

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user || null;

    // Persistir usuário e sessão no localStorage
    if (user) {
      localStorage.setItem('rotaraiz_user', JSON.stringify(user));
      localStorage.setItem('rotaraiz_user_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('rotaraiz_user');
      localStorage.removeItem('rotaraiz_user_session');
    }

    callback(user, event);
  });

  // Retornar função de cancelamento de inscrição
  return () => data?.subscription?.unsubscribe?.();
};
