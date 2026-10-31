import React, { useCallback, useEffect, useState } from "react";
import {
  Plus,
  MapPin,
  ArrowUpRight,
  Camera,
  Search,
  Users,
  RefreshCw,
  Utensils,
  Waves,
  Compass,
  BedDouble,
  ChevronRight,
} from "lucide-react";
import Sheet from "./Sheet";
import CommunityCard from "./CommunityCard";
import ExperienceForm from "./ExperienceForm";
import {experiencePublication} from "../lib/liveExperiencePublication";
import { groupCommunityRecommendations } from "../lib/communityGroups";
import * as liveCommunity from "../lib/community";
import {
  profileName,
  COMMUNITY_CATEGORIES,
  instagramUrl,
  safeInstagram,
  validRecommendation,
} from "../lib/community";

const icons = {
  Comida: Utensils,
  Praia: Waves,
  Passeio: Compass,
  Hospedagem: BedDouble,
  Outros: MapPin,
};
const LEGACY = "rotaraiz_recommendations_v1";
export default function CommunityView({ onRoute, onSavePlace, onViewExperiences, user, openRequest, onOpenHandled, onOpenProfile, api = liveCommunity, publicationService=experiencePublication, placeSearch, photoUrlFor }) {
  const [formLocked,setFormLocked]=useState(false);
  const [engagement,setEngagement] = useState({});
  const [authors,setAuthors]=useState({});
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("Todos"),
    [form, setForm] = useState(null),
    [notice, setNotice] = useState(""),
    [legacy, setLegacy] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem(LEGACY) || "[]").filter(
          validRecommendation,
        );
      } catch {
        return [];
      }
    });
  const refresh = useCallback(async () => {
    try {
      const r = await api.getRecommendations();
      if (!r.available)
        throw new Error(
          "Não foi possível carregar as indicações compartilhadas. Tente novamente.",
        );
      setItems(r.items);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [api]);
  useEffect(() => {
    refresh();
    const focus = () => {
      if (!document.hidden) refresh();
    };
    const timer = setInterval(focus, 15000);
    window.addEventListener("focus", focus);
    window.addEventListener("online", focus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", focus);
      window.removeEventListener("online", focus);
    };
  }, [refresh]);
  useEffect(() => {
    if(!user?.id)return;
    api.getEngagement(user.id).then(setEngagement).catch(()=>{});
  },[items,user?.id,api]);
  useEffect(()=>{
    if(!openRequest || loading || error)return;
    if(!items.some(item=>item.id===openRequest.id)){
      setNotice("Essa indicação não está mais disponível. Veja outras dicas da comunidade.");onOpenHandled?.();
    }
  },[openRequest,loading,error,items,onOpenHandled]);
  const list = items.filter(
    (i) =>
      (category === "Todos" || i.category === category || (category==="Alimentação" && i.category==="Comida")) &&
      `${i.name} ${i.city} ${i.address} ${i.author_name || ""}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  useEffect(()=>{
    let active=true;
    const ids=[...new Set(items.map(x=>x.user_id).filter(Boolean))];
    api.getPublicAuthors(ids).then(profiles=>{if(active)setAuthors(profiles);}).catch(()=>{});
    return()=>{active=false;};
  },[items,api]);
  const groupedList=groupCommunityRecommendations(list);
  async function publish(published) {
    const visible=published.status==='approved'&&!published.deleted_at;
    setItems(current=>visible?[published,...current.filter(item=>item.id!==published.id)]:current.filter(item=>item.id!==published.id));
    if(form?.legacyId){const next=legacy.filter(item=>item.id!==form.legacyId);setLegacy(next);try{localStorage.setItem(LEGACY,JSON.stringify(next));}catch{}}
    setForm(null);setNotice(visible?'Experiência salva e compartilhada na Comunidade.':'Experiência salva para revisão.');
  }
  async function deleteOwn(item) {
    if(!window.confirm("Remover esta experiência da Comunidade? O histórico será preservado."))return;
    try{
      await publicationService.setDeleted(item,true);
      setItems(current=>current.filter(i=>i.id!==item.id));
      setNotice("Indicação excluída.");
    } catch(e){setError(e.message);}
  }
  return (
    <div className="travel-page community-page">
      <div className="community-heading">
        <div>
          <span className="eyebrow">DE VIAJANTE PARA VIAJANTE</span>
          <h1>
            Boas descobertas
            <br />
            <span>circulam por aqui.</span>
          </h1>
          <p>Lugares e dicas de quem viveu o caminho.</p>
        </div>
        <button aria-label="Indicar lugar" className="community-add" onClick={() => setForm({})}>
          <Plus size={20} />
          <span>Indicar lugar</span>
        </button>
      </div>
      <details className="rr-community-guidelines">
        <summary>Regras de convivência da comunidade</summary>
        <p>Compartilhe dicas reais com respeito. Não são permitidos xingamentos, ameaças, ataques pessoais, discriminação, spam ou exposição de dados privados. Comentários com ofensas claras são bloqueados; casos ambíguos ficam retidos para revisão. Você pode denunciar um comentário usando o botão Denunciar.</p>
      </details>
      <div className="community-searchbar">
        <Search size={19} />
        <input
          aria-label="Buscar indicação por lugar ou cidade"
          placeholder="Lugar, cidade ou quem indicou"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="icon-button"
          aria-label="Atualizar indicações"
          onClick={refresh}
        >
          <RefreshCw size={17} />
        </button>
      </div>
      <div
        className="community-filters"
        role="group"
        aria-label="Categorias de indicações"
      >
        {["Todos", ...COMMUNITY_CATEGORIES].map((c) => (
          <button
            key={c}
            aria-pressed={c === category}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      {notice && (
        <p className="community-notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {legacy.length > 0 && (
        <details className="community-legacy">
          <summary>
            {legacy.length}{" "}
            {legacy.length === 1
              ? "indicação ainda não publicada"
              : "indicações ainda não publicadas"}
          </summary>
          <p>
            São os cadastros antigos deste aparelho. Abra para conferir e
            publicar com seu perfil.
          </p>
          {legacy.map((i) => (
            <button
              key={i.id}
              onClick={() => setForm({ initial: i, legacyId: i.id })}
            >
              <span>{i.name}</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </details>
      )}
      <div className="community-feed-heading">
        <h2>Indicações da comunidade</h2>
        <span>
          {loading
            ? "Carregando…"
            : `${groupedList.length} ${groupedList.length === 1 ? "lugar" : "lugares"} · ${list.length} ${list.length === 1 ? "indicação" : "indicações"}`}
        </span>
      </div>
      {loading ? (
        <p role="status">Buscando as últimas descobertas…</p>
      ) : !list.length ? (
        <section className="community-empty">
          <Users size={29} />
          <h2>
            {query || category !== "Todos"
              ? "Nenhuma dica nesse filtro."
              : "Qual lugar merece entrar nessa roda?"}
          </h2>
          <p>
            {query || category !== "Todos"
              ? "Experimente outra cidade ou categoria."
              : "Indique seu restaurante favorito, uma praia ou aquele passeio que valeu o caminho."}
          </p>
          <button className="small-action" onClick={() => setForm({})}>
            <Plus size={17} /> Compartilhar uma descoberta
          </button>
        </section>
      ) : (
        <div className="community-feed">
          {groupedList.map(group=><CommunityCard key={group[0].id} openRequest={openRequest && group.some(item=>item.id===openRequest.id)?openRequest:null} onOpenHandled={onOpenHandled} groupItems={group} user={user}
              api={api} photoUrlFor={photoUrlFor}
              allStats={engagement}
              authorProfile={authors[group[0].user_id]}
              authorProfiles={authors}
              onRoute={onRoute}
              onSavePlace={onSavePlace}
              onViewExperiences={onViewExperiences}
              onOpenProfile={onOpenProfile}
              onRefresh={refresh}
              onError={setError}
              onEdit={item=>setForm({initial:item,editId:item.id})}
              onDelete={deleteOwn} />)}
        </div>
      )}
      <p className="community-footnote">
        Dicas de viajantes. Confirme o funcionamento diretamente com o lugar.
      </p>
      {form && (
        <Sheet title={form.editId?"Editar indicação":"Compartilhe uma descoberta"} onClose={()=>{if(!formLocked)setForm(null);}}>
          <ExperienceForm user={user} initial={form.editId?form.initial:form.legacyId?{...form.initial,id:undefined}:null} onSaved={publish} onLockChange={setFormLocked} service={publicationService} searchApi={placeSearch} urlFor={photoUrlFor}/>
        </Sheet>
      )}
    </div>
  );
}
export {default as RecommendationForm} from './ExperienceForm';
