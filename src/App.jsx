import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import RoutesView from "./components/RoutesView";
import RouteDetailView from "./components/RouteDetailView";
import ToursView from "./components/ToursView";
import TourDetailView from "./components/TourDetailView";
import AccountsView from "./components/AccountsView";
import { captureInvite, clearInvite } from "./lib/sharedTrips";
import CommunityView from "./components/CommunityView";
import { ArrowLeft, MapPin } from "lucide-react";
import MapView from "./components/MapView";
import AdminView from "./components/AdminView";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import LoginScreen from "./components/LoginScreen";
import ItineraryView, { SavePlaceSheet } from "./components/ItineraryView";
import useItineraries from "./hooks/useItineraries";
import { placeVisit } from "./lib/itinerary";

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
  const [inviteToken, setInviteToken] = useState(captureInvite);
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState(null);
  const [signOutError, setSignOutError] = useState("");
  const itineraries = useItineraries(session?.user?.id);
  const [pendingPlace,setPendingPlace] = useState(null);
  const [experienceOpenRequest,setExperienceOpenRequest] = useState(0);
  const [theme,setTheme] = useState(()=>{try{return localStorage.getItem("rotaraiz_theme")==="dark"?"dark":"light";}catch{return "light";}});
  useEffect(()=>{document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;try{localStorage.setItem("rotaraiz_theme",theme);}catch{}},[theme]);
  function openExperiences(){setExperienceOpenRequest(n=>n+1);handleTabChange("itinerary");}
  const [itineraryNotice,setItineraryNotice] = useState("");
  const [savePlaceError,setSavePlaceError] = useState("");
  useEffect(()=>{ setItineraryNotice("");setSavePlaceError("");setPendingPlace(previous=>{previous?.resolve(false);return null;}); },[session?.user?.id]);
  async function addPlaceToTrip(place) {
    setSavePlaceError("");
    if(itineraries.loading||itineraries.busy) {setSavePlaceError("Aguarde o roteiro carregar ou terminar de salvar.");return false;}
    if(itineraries.error){setSavePlaceError(itineraries.error);return false;}
    if(itineraries.plans.length===1) {
      const plan=itineraries.plans[0];
      try {if(!plan.visits.some(v=>v.placeId===String(place.id)))await itineraries.save({...plan,visits:[...plan.visits,placeVisit(place)]});itineraries.select(plan.id);setItineraryNotice(`${place.title} está em ${plan.title}, em Minhas viagens.`);return true;}catch(e){setSavePlaceError(e.message);return false;}
    }
    return new Promise(resolve=>setPendingPlace({place,resolve}));
  }

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


  const [activeTab, setActiveTab] = useState(inviteToken ? "trip" : "tours");
  const [communityOpenRequest,setCommunityOpenRequest] = useState(null);
  const openCommunityPlace = id => {setCommunityOpenRequest({id,token:crypto.randomUUID()});setSelectedTour(null);setSelectedRoute(null);setActiveTab("community");window.scrollTo({top:0,behavior:"instant"});};
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
        theme={theme}
        onThemeChange={()=>setTheme(t=>t==="dark"?"light":"dark")}
      />

      {itineraryNotice && !itineraries.loading && <p className="itinerary-app-notice" role="status">{itineraryNotice}<button onClick={()=>{setItineraryNotice("");handleTabChange("itinerary");}}>Ver viagem</button></p>}
      {savePlaceError && <p className="form-error itinerary-app-notice" role="alert">{savePlaceError}<button onClick={()=>{setSavePlaceError("");itineraries.refresh();}}>Tentar carregar novamente</button></p>}
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
            onSaveTour={addPlaceToTrip}
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
        ) : activeTab === "itinerary" ? (
          <ItineraryView store={itineraries} onOpenPlace={setSelectedTour} onRoute={goToRoutesWith} experienceOpenRequest={experienceOpenRequest} />
        ) : activeTab === "trip" ? (
          <AccountsView key={session.user.id} user={session.user} inviteToken={inviteToken} onInviteHandled={() => { clearInvite(); setInviteToken(null); }} />
        ) : activeTab === "community" ? (
          <CommunityView openRequest={communityOpenRequest} onOpenHandled={()=>setCommunityOpenRequest(null)} key={session.user.id} user={session.user} onRoute={goToRoutesWith} onSavePlace={addPlaceToTrip} onViewExperiences={openExperiences} />
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
              onOpenCommunity={openCommunityPlace}
              onRoute={goToRoutesWith}
              visible={!selectedTour && !selectedRoute}
              home={home}
              onChangeHome={changeHome}
              onSaveTour={addPlaceToTrip}
              onSelectTour={setSelectedTour}
            />
          </div>
        )}
      </main>
      {pendingPlace && !itineraries.loading && <SavePlaceSheet place={pendingPlace.place} store={itineraries} onClose={()=>{pendingPlace.resolve(false);setPendingPlace(null);}} onComplete={title=>{setItineraryNotice(`${pendingPlace.place.title} está em ${title}, em Minhas viagens.`);pendingPlace.resolve(true);setPendingPlace(null);}} />}

      <BottomNav
        activeTab={activeTab === "map" ? mapReturnTab : activeTab}
        onChangeTab={handleTabChange}
      />
    </div>
  );
}
