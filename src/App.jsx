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

  const [activeTab, setActiveTab] = useState('tours');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedTour, setSelectedTour] = useState(null);
  const [mapDestination, setMapDestination] = useState(null);
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
    window.scrollTo({top:0,behavior:'instant'});
  };

  const handleOpenMapWithRoute = (route) => {
    setMapDestination(null);
    setSelectedRouteLegsForMap(route?.legs || null);
    setSelectedRoute(null);
    setSelectedTour(null);
    setActiveTab('map');
  };

  const handleOpenMapWithTour = (tour) => {
    setMapDestination(tour);
    setSelectedRouteLegsForMap(null);
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
    <div className="app-root">
      <a className="skip-link" href="#main-content">Ir para o conteúdo</a>
      <Navbar
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        isOnline={isOnline}
        dataSource={dataSource}
      />

      <main id="main-content" className={`app-main ${activeTab === 'map' ? 'app-main-map' : ''}`}>
        {selectedRoute ? (
          <RouteDetailView
            route={selectedRoute}
            onBack={() => setSelectedRoute(null)}
            onOpenMapWithRoute={handleOpenMapWithRoute}
          />
        ) : selectedTour ? (
          <TourDetailView
            tour={selectedTour}
            home={home}
            onBack={() => {setSelectedTour(null); requestAnimationFrame(() => document.dispatchEvent(new Event('rota-raiz:catalog-return')));}}
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
            destination={mapDestination}
            routeLegsToDraw={selectedRouteLegsForMap}
            onSelectPinRoute={goToRoutesWith}
            onOpenTour={setSelectedTour}
          />
        ) : activeTab === 'tours' ? (
          null
        ) : activeTab === 'admin' ? (
          <AdminView onBack={() => setActiveTab('routes')} />
        ) : null}
        {activeTab === 'tours' && <div hidden={!!selectedTour || !!selectedRoute}><ToursView home={home} onChangeHome={changeHome} onSelectTour={setSelectedTour} /></div>}
      </main>

      <BottomNav activeTab={activeTab} onChangeTab={handleTabChange} />
    </div>
  );
}
