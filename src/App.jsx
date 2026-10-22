import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import RoutesView from './components/RoutesView';
import RouteDetailView from './components/RouteDetailView';
import ToursView from './components/ToursView';
import TourDetailView from './components/TourDetailView';
import MapView from './components/MapView';
import AdminView from './components/AdminView';
import LoginView from './components/LoginView';
import UserProfile from './components/UserProfile';
import { isSupabaseConfigured, getCurrentUser, onAuthStateChanged } from './lib/supabase';

const HOME_KEY = 'rotaraiz_home';

const loadHome = () => {
  try {
    const saved = localStorage.getItem(HOME_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export default function App() {
  // Autenticação
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // "Onde estou": usado como origem das rotas e como base das distâncias dos passeios.
  // É sempre escolhido por quem usa o app (nada fixo no código).
  const [home, setHome] = useState(loadHome);

  const [activeTab, setActiveTab] = useState('routes');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedTour, setSelectedTour] = useState(null);
  const [selectedRouteLegsForMap, setSelectedRouteLegsForMap] = useState(null);
  const [prefilledDestination, setPrefilledDestination] = useState('');

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const dataSource = isSupabaseConfigured() ? 'supabase' : 'local';

  // Verificar usuário logado ao montar o componente
  useEffect(() => {
    const initAuth = async () => {
      setAuthLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setAuthLoading(false);
    };

    initAuth();

    // Ouvir mudanças de autenticação
    if (isSupabaseConfigured()) {
      const unsubscribe = onAuthStateChanged((loggedUser) => {
        setUser(loggedUser);
      });
      return () => unsubscribe?.();
    }
  }, []);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const changeHome = (point) => {
    setHome(point);
    try {
      if (point?.name) localStorage.setItem(HOME_KEY, JSON.stringify(point));
      else localStorage.removeItem(HOME_KEY);
    } catch {
      /* sem armazenamento: segue funcionando */
    }
  };

  const handleTabChange = (tabId) => {
    setSelectedRoute(null);
    setSelectedTour(null);
    if (tabId !== 'routes') setPrefilledDestination('');
    setActiveTab(tabId);
  };

  const handleOpenMapWithRoute = (route) => {
    setSelectedRouteLegsForMap(route?.legs || null);
    setSelectedRoute(null);
    setSelectedTour(null);
    setActiveTab('map');
  };

  const handleOpenMapWithTour = () => {
    setSelectedTour(null);
    setSelectedRoute(null);
    setActiveTab('map');
  };

  const goToRoutesWith = (destinationName) => {
    setSelectedRoute(null);
    setSelectedTour(null);
    setPrefilledDestination(destinationName);
    setActiveTab('routes');
  };

  // Mostrar tela de carregamento enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5EDE1] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-3 border-[#e0d5c1] border-t-[#c2461f] animate-spin" />
          <p className="text-sm text-[#59413b]">Carregando...</p>
        </div>
      </div>
    );
  }

  // Mostrar tela de login se não estiver autenticado
  if (!user && isSupabaseConfigured()) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#F5EDE1] flex flex-col text-[#201B15] overflow-x-hidden">
      <Navbar
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        isOnline={isOnline}
        dataSource={dataSource}
        user={user}
        onLogout={() => setUser(null)}
      />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-4 pb-28 md:pb-10 min-w-0">
        {selectedRoute ? (
          <RouteDetailView
            route={selectedRoute}
            onBack={() => setSelectedRoute(null)}
            onOpenMapWithRoute={handleOpenMapWithRoute}
          />
        ) : selectedTour ? (
          <TourDetailView
            tour={selectedTour}
            onBack={() => setSelectedTour(null)}
            onOpenMapWithTour={handleOpenMapWithTour}
            onSwitchToRoute={goToRoutesWith}
          />
        ) : activeTab === 'routes' ? (
          <RoutesView
            origin={home}
            onChangeOrigin={changeHome}
            initialDestination={prefilledDestination}
            onSelectRoute={(r) => {
              setSelectedTour(null);
              setSelectedRoute(r);
            }}
            onNavigateToAdmin={() => setActiveTab('admin')}
          />
        ) : activeTab === 'map' ? (
          <MapView
            home={home}
            routeLegsToDraw={selectedRouteLegsForMap}
            onSelectPinRoute={goToRoutesWith}
          />
        ) : activeTab === 'tours' ? (
          <ToursView home={home} onChangeHome={changeHome} onSelectTour={setSelectedTour} />
        ) : activeTab === 'admin' ? (
          <AdminView onBack={() => setActiveTab('routes')} />
        ) : null}
      </main>

      <BottomNav activeTab={activeTab} onChangeTab={handleTabChange} />
    </div>
  );
}
