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
export default function CommunityView({ onRoute, onSavePlace, user, api = liveCommunity }) {
  const [engagement,setEngagement] = useState({});
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
  const list = items.filter(
    (i) =>
      (category === "Todos" || i.category === category) &&
      `${i.name} ${i.city} ${i.address} ${i.author_name || ""}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  async function publish(item,photo) {
    const editing=!!form?.editId;
    const published = editing ? await api.updateRecommendation(form.editId,item) : await api.submitRecommendation(item);
    let photoFailed=false;
    if(photo){
      try{published.image_url=await api.uploadRecommendationPhoto(user,published.id,photo,published.image_url);}
      catch(e){photoFailed=true;}
    }
    setItems((current) => [
      published,
      ...current.filter((i) => i.id !== published.id),
    ]);
    if (form?.legacyId) {
      const next = legacy.filter((i) => i.id !== form.legacyId);
      setLegacy(next);
      try {
        localStorage.setItem(LEGACY, JSON.stringify(next));
      } catch {
        /* Published row already exists in database. */
      }
    }
    setForm(null);
    setNotice(photoFailed ? "Indicação salva, mas não foi possível enviar a foto. Abra o card e tente novamente." : (editing ? "Indicação atualizada." : "Indicação publicada para toda a comunidade."));
  }
  async function deleteOwn(item) {
    if(!window.confirm("Excluir sua indicação e todos os comentários e curtidas associados?"))return;
    try{
      await api.deleteRecommendation(item.id,item.image_url);
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
        <button className="community-add" onClick={() => setForm({})}>
          <Plus size={20} />
          <span>Indicar lugar</span>
        </button>
      </div>
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
            : `${list.length} ${list.length === 1 ? "lugar" : "lugares"}`}
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
          {list.map(i=><CommunityCard key={i.id} item={i} user={user}
              stats={engagement[i.id]}
              onRoute={onRoute}
              onSavePlace={onSavePlace}
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
        <Sheet title={form.editId?"Editar indicação":"Compartilhe uma descoberta"} onClose={() => setForm(null)}>
          <RecommendationForm
            user={user}
            initial={form.initial}
            editing={!!form.editId}
            onSave={publish}
          />
        </Sheet>
      )}
    </div>
  );
}
function RecommendationForm({ user, initial, editing, onSave }) {
  const [photo,setPhoto]=useState(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="compact-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        try {
          const f = new FormData(e.currentTarget);
          const item = {
            name: f.get("name").trim(),
            category: f.get("category"),
            city: f.get("city").trim(),
            address: f.get("address").trim(),
            instagram: instagramUrl(f.get("instagram")),
            note: f.get("note").trim(),
          };
          if (!item.name || !item.city || !item.address || !item.note)
            throw new Error("Preencha nome, cidade, endereço e sua dica.");
          setBusy(true);
          setError("");
          await onSave(item,photo);
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="community-publish-as">
        Você indica como <b>{profileName(user)}</b>.
      </p>
      <label>
        Nome do lugar
        <input
          name="name"
          defaultValue={initial?.name}
          required
          maxLength={120}
          placeholder="Qual é a sua descoberta?"
        />
      </label>
      <div className="form-pair">
        <label>
          Categoria
          <select name="category" defaultValue={initial?.category}>
            {COMMUNITY_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Cidade e estado
          <input
            name="city"
            defaultValue={initial?.city}
            placeholder="João Pessoa, PB"
            required
            maxLength={120}
          />
        </label>
      </div>
      <label>
        Endereço completo
        <input
          name="address"
          defaultValue={initial?.address}
          placeholder="Rua, número e bairro"
          required
          maxLength={300}
        />
      </label>
      <label>
        Instagram <small>opcional</small>
        <input
          name="instagram"
          defaultValue={initial?.instagram}
          placeholder="@nomedolugar"
          maxLength={120}
          autoCapitalize="none"
        />
      </label>
      <label>
        Sua dica
        <textarea
          name="note"
          defaultValue={initial?.note}
          required
          maxLength={500}
          rows={3}
          placeholder="O que vale conhecer por lá?"
        />
      </label>
      <label>
        Foto do lugar <small>opcional · JPG, PNG ou WebP, até 3 MB</small>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPhoto(e.target.files?.[0]||null)} />
      </label>
      <p className="field-help">
        Seu nome e esta indicação ficam visíveis para as pessoas do app. Use o
        endereço público do estabelecimento.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary-action" disabled={busy}>
        {busy ? "Salvando…" : (editing ? "Salvar alterações" : "Publicar na comunidade")}
      </button>
    </form>
  );
}
