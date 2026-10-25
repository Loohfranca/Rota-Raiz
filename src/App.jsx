import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import RoutesView from "./components/RoutesView";
import RouteDetailView from "./components/RouteDetailView";
import ToursView from "./components/ToursView";
import TourDetailView from "./components/TourDetailView";
import TripView from "./components/TripView";
import CommunityView from "./components/CommunityView";
import { ArrowLeft, MapPin } from "lucide-react";
import MapView from "./components/MapView";
import AdminView from "./components/AdminView";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import LoginScreen from "./components/LoginScreen";

const HOME_KEY = "rotaraiz_home";

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
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState(null);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.warn("Falha ao recuperar sessão:", error.message);
      setSession(data?.session ?? null);
      setAuthReady(true);
    }).catch(() => { if (active) setAuthReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setAuthReady(true);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setSignOutError("Não foi possível sair. Tente novamente.");
    else setSignOutError("");
  }


  const [activeTab, setActiveTab] = useState("tours");
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedTour, setSelectedTour] = useState(null);
  const [mapReturnTab, setMapReturnTab] = useState("tours");
  const [mapDestination, setMapDestination] = useState(null);
  const [selectedRouteLegsForMap, setSelectedRouteLegsForMap] = useState(null);
  const [prefilledDestination, setPrefilledDestination] = useState("");

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const dataSource = isSupabaseConfigured() ? "supabase" : "local";

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
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
    if (tabId !== "routes") setPrefilledDestination("");
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleOpenMapWithRoute = (route) => {
    setMapReturnTab("routes");
    setMapDestination(null);
    setSelectedRouteLegsForMap(route?.legs || null);
    setSelectedRoute(null);
    setSelectedTour(null);
    setActiveTab("map");
  };

  const handleOpenMapWithTour = (tour) => {
    setMapReturnTab("tours");
    setMapDestination(tour);
    setSelectedRouteLegsForMap(null);
    setSelectedTour(null);
    setSelectedRoute(null);
    setActiveTab("map");
  };

  const goToRoutesWith = (destinationName) => {
    setSelectedRoute(null);
    setSelectedTour(null);
    setPrefilledDestination(destinationName);
    setActiveTab("routes");
  };

  if (!authReady || !session) return <LoginScreen loading={!authReady} />;

  return (
    <div className="app-root">
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo
      </a>
      <Navbar
        activeTab={activeTab === "map" ? mapReturnTab : activeTab}
        onChangeTab={handleTabChange}
        isOnline={isOnline}
        dataSource={dataSource}
        user={session.user}
        onSignOut={signOut}
      />

      {signOutError && <p role="alert" style={{ textAlign: "center", color: "#a64425" }}>{signOutError}</p>}
      <main
        id="main-content"
        className={`app-main ${activeTab === "map" ? "app-main-map" : ""}`}
      >
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
            onBack={() => setSelectedTour(null)}
            onOpenMapWithTour={handleOpenMapWithTour}
            onSwitchToRoute={goToRoutesWith}
          />
        ) : activeTab === "routes" ? (
          <>
            <button
              className="small-action contextual-map"
              onClick={() => {
                setMapReturnTab("routes");
                setMapDestination(null);
                setSelectedRouteLegsForMap(null);
                setActiveTab("map");
              }}
            >
              <MapPin size={17} /> Ver lugares e embarques
            </button>
            <RoutesView
              origin={home}
              onChangeOrigin={changeHome}
              initialDestination={prefilledDestination}
              onSelectRoute={(r) => {
                setSelectedTour(null);
                setSelectedRoute(r);
              }}
              onNavigateToAdmin={() => setActiveTab("admin")}
            />
          </>
        ) : activeTab === "map" ? (
          <>
            <button
              className="small-action map-back"
              onClick={() => handleTabChange(mapReturnTab)}
            >
              <ArrowLeft size={17} /> Voltar
            </button>
            <MapView
              home={home}
              destination={mapDestination}
              routeLegsToDraw={selectedRouteLegsForMap}
              onSelectPinRoute={goToRoutesWith}
              onOpenTour={setSelectedTour}
            />
          </>
        ) : activeTab === "trip" ? (
          <TripView onOpenTour={setSelectedTour} />
        ) : activeTab === "community" ? (
          <CommunityView key={session.user.id} user={session.user} onRoute={goToRoutesWith} />
        ) : activeTab === "tours" ? null : activeTab === "admin" ? (
          <AdminView onBack={() => setActiveTab("routes")} />
        ) : null}
        {activeTab === "tours" && (
          <div hidden={!!selectedTour || !!selectedRoute}>
            <button
              className="small-action contextual-map"
              onClick={() => {
                setMapReturnTab("tours");
                setMapDestination(null);
                setSelectedRouteLegsForMap(null);
                setActiveTab("map");
              }}
            >
              <MapPin size={17} /> Lugares e embarques no mapa
            </button>
            <ToursView
              onRoute={goToRoutesWith}
              visible={!selectedTour && !selectedRoute}
              home={home}
              onChangeHome={changeHome}
              onSelectTour={setSelectedTour}
            />
          </div>
        )}
      </main>

      <BottomNav
        activeTab={activeTab === "map" ? mapReturnTab : activeTab}
        onChangeTab={handleTabChange}
      />
    </div>
  );
}
