import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import RoutesView from './components/RoutesView';
import RouteDetailView from './components/RouteDetailView';
import ToursView from './components/ToursView';
import TourDetailView from './components/TourDetailView';
import MapView from './components/MapView';
import AdminView from './components/AdminView';
import { isSupabaseConfigured } from './lib/supabase';

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

  return (
    <div className="min-h-screen bg-[#F5EDE1] flex flex-col text-[#201B15]">
      <Navbar
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        isOnline={isOnline}
        dataSource={dataSource}
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
