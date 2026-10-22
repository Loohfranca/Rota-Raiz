import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import RoutesView from './components/RoutesView';
import RouteDetailView from './components/RouteDetailView';
import ToursView from './components/ToursView';
import TourDetailView from './components/TourDetailView';
import MapView from './components/MapView';
import AdminView from './components/AdminView';
import ChangeCityModal from './components/ChangeCityModal';
import RegionModal from './components/RegionModal';
import { REGIONS } from './data/regionsData';
import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const [currentRegion, setCurrentRegion] = useState(() => {
    const saved = localStorage.getItem('rotaraiz_current_region');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return REGIONS[0];
  });

  const [currentLocation, setCurrentLocation] = useState(() => {
    return currentRegion.cities ? currentRegion.cities[0] : null;
  });

  const [activeTab, setActiveTab] = useState('routes');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedTour, setSelectedTour] = useState(null);
  const [selectedRouteLegsForMap, setSelectedRouteLegsForMap] = useState(null);

  // Status Real: Conexão e Origem de dados
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const dataSource = isSupabaseConfigured() ? 'supabase' : 'local';

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Modals state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChangeCityModalOpen, setIsChangeCityModalOpen] = useState(false);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);

  // Troca de região
  const handleSelectRegion = (newRegion) => {
    setCurrentRegion(newRegion);
    localStorage.setItem('rotaraiz_current_region', JSON.stringify(newRegion));
    if (newRegion.cities && newRegion.cities.length > 0) {
      setCurrentLocation(newRegion.cities[0]);
    }
    setSelectedRoute(null);
    setSelectedTour(null);
  };

  const handleSelectRoute = (routeCalculated) => {
    setSelectedTour(null);
    setSelectedRoute(routeCalculated);
  };

  const handleSelectTour = (tour) => {
    setSelectedRoute(null);
    setSelectedTour(tour);
  };

  const handleOpenMapWithTour = (tour) => {
    setSelectedTour(null);
    setSelectedRoute(null);
    setActiveTab('map');
  };

  const handleOpenMapWithRoute = (route) => {
    setSelectedRouteLegsForMap(route?.legs || null);
    setSelectedRoute(null);
    setSelectedTour(null);
    setActiveTab('map');
  };

  const [prefilledDestination, setPrefilledDestination] = useState('');

  const handleSelectPinRoute = (destinationName) => {
    setSelectedRoute(null);
    setPrefilledDestination(destinationName);
    setActiveTab('routes');
  };

  const handleSwitchToRoute = (destinationTitle) => {
    setSelectedTour(null);
    setPrefilledDestination(destinationTitle);
    setActiveTab('routes');
  };

  const handleTabChange = (tabId) => {
    setSelectedRoute(null);
    setSelectedTour(null);
    if (tabId !== 'routes') setPrefilledDestination('');
    setActiveTab(tabId);
  };

  return (
    <div className="min-h-screen bg-[#F5EDE1] flex flex-col text-[#201B15] overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        currentRegion={currentRegion}
        onOpenRegionModal={() => setIsRegionModalOpen(true)}
        isOnline={isOnline}
        dataSource={dataSource}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Layout Area: Sidebar (Desktop) + Content Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto min-w-0">
        {/* Sidebar Component */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          onChangeTab={handleTabChange}
          currentRegion={currentRegion}
          onOpenRegionModal={() => setIsRegionModalOpen(true)}
          isOnline={isOnline}
          dataSource={dataSource}
        />

        {/* Dynamic Main View Area (Fluid, no fixed px containers) */}
        <main className="flex-1 p-3.5 sm:p-6 pb-24 md:pb-8 overflow-y-auto min-w-0 w-full">
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
              onSwitchToRoute={handleSwitchToRoute}
            />
          ) : activeTab === 'routes' ? (
            <RoutesView
              currentRegion={currentRegion}
              currentLocation={currentLocation}
              initialDestination={prefilledDestination}
              onOpenChangeCity={() => setIsChangeCityModalOpen(true)}
              onOpenRegionModal={() => setIsRegionModalOpen(true)}
              onSelectRoute={handleSelectRoute}
              onNavigateToAdmin={() => setActiveTab('admin')}
            />
          ) : activeTab === 'map' ? (
            <MapView
              currentRegion={currentRegion}
              currentLocation={currentLocation}
              routeLegsToDraw={selectedRouteLegsForMap}
              onSelectPinRoute={handleSelectPinRoute}
            />
          ) : activeTab === 'tours' ? (
            <ToursView
              currentRegion={currentRegion}
              currentLocation={currentLocation}
              onOpenChangeCity={() => setIsChangeCityModalOpen(true)}
              onSelectTour={handleSelectTour}
            />
          ) : activeTab === 'admin' ? (
            <AdminView
              currentRegion={currentRegion}
              onBack={() => setActiveTab('routes')}
            />
          ) : null}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed 3 Tabs: Rotas, Mapa, Passeios) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={handleTabChange}
      />

      {/* Global Modals */}
      <RegionModal
        isOpen={isRegionModalOpen}
        onClose={() => setIsRegionModalOpen(false)}
        currentRegion={currentRegion}
        onSelectRegion={handleSelectRegion}
      />

      <ChangeCityModal
        isOpen={isChangeCityModalOpen}
        onClose={() => setIsChangeCityModalOpen(false)}
        currentRegion={currentRegion}
        currentLocation={currentLocation}
        onSelectLocation={(loc) => setCurrentLocation(loc)}
      />
    </div>
  );
}
