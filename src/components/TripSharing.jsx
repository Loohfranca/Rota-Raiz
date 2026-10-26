import React, { useEffect, useState } from "react";
import { Copy, Link, LogOut, Users, ArrowRight } from "lucide-react";
import Sheet from "./Sheet";
import * as liveApi from "../lib/sharedTrips";
export function TripInvite({ trip, api = liveApi, onClose }) {
  const [person, setPerson] = useState(""),
    [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false);
  const unlinked = trip.people.filter(
    (p) => !trip.members?.some((m) => m.person_id === p.id),
  );
  async function create() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const token = await api.tripRpc("rr_create_invite", {
        p_trip: trip.id,
        p_person: person || null,
      });
      setUrl(api.inviteUrl(token));
      setCopied(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet title="Viajar junto" onClose={onClose}>
      <div className="trip-sharing-intro">
        <Users size={25} />
        <p>
          Convide alguém para <b>{trip.name}</b>. Vocês veem e registram os
          mesmos gastos.
        </p>
      </div>
      <label className="share-person">
        Quem vai receber?
        <select
          value={person}
          onChange={(e) => {
            setPerson(e.target.value);
            setUrl("");
          }}
        >
          <option value="">Uma nova pessoa</option>
          {unlinked.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — já está na divisão
            </option>
          ))}
        </select>
      </label>
      <p className="field-help">
        Se a pessoa já está nas contas, selecione seu nome para manter a
        divisão. O convite vale por 7 dias e uma entrada. Gere um link para cada amigo.
        Quem entrar depois participa dos próximos gastos; para incluir essa pessoa nos anteriores, edite a divisão.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {url ? (
        <div className="invite-ready">
          <span className="eyebrow">CONVITE PRONTO</span>
          <p>
            Envie este link apenas para quem vai participar. A pessoa entra com
            Google e confirma o convite.
          </p>
          <label>
            Link de convite
            <input readOnly value={url} onFocus={(e) => e.target.select()} />
          </label>
          <button
            className="primary-action"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
              } catch {
                setError("Copie o link pelo campo acima.");
              }
            }}
          >
            <Copy size={17} />
            {copied ? "Link copiado" : "Copiar convite"}
          </button>
        </div>
      ) : (
        <button className="primary-action" disabled={busy} onClick={create}>
          <Link size={17} />
          {busy ? "Gerando…" : "Gerar link de convite"}
        </button>
      )}
      <div className="sharing-members">
        <h3>Já estão juntos</h3>
        {trip.members?.map((m) => (
          <p key={m.user_id}>
            <span className="member-dot" />
            {m.name}
          </p>
        ))}
      </div>
    </Sheet>
  );
}
export function JoinTrip({ token, api = liveApi, onJoined, onDismiss }) {
  const [info, setInfo] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    api
      .tripRpc("rr_preview_invite", { p_token: token })
      .then((data) => {
        if (live) setInfo(data);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [api, token]);
  return (
    <section className="join-trip-panel" aria-label="Convite para viagem">
      <span className="eyebrow">UM CAMINHO PARA FAZER JUNTOS</span>
      <h2>{info?.name || "Você recebeu um convite"}</h2>
      {info && (
        <p>
          {info.inviter} convidou você para compartilhar esta viagem. Ao
          aceitar, os participantes poderão ver os gastos que você registrar.
        </p>
      )}
      {!info && !error && <p role="status">Conferindo seu convite…</p>}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div>
        {info && (
          <button
            className="primary-action"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const result = await api.tripRpc("rr_join_trip", {
                  p_token: token,
                });
                await onJoined(result.id);
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy
              ? "Entrando…"
              : info.already_joined
                ? "Abrir minha viagem"
                : "Aceitar e entrar"}
            <ArrowRight size={17} />
          </button>
        )}
        <button className="small-action" onClick={onDismiss}>
          Agora não
        </button>
      </div>
    </section>
  );
}
export function LeaveTrip({ trip, saving, onLeave, onClose }) {
  return (
    <Sheet title="Sair desta viagem?" onClose={onClose}>
      <p>
        Você deixa de ver <b>{trip.name}</b> e seus gastos. Quem continuar na
        viagem mantém o histórico, inclusive as despesas e divisões já
        registradas.
      </p>
      <p className="field-help">
        Para voltar depois, você precisará de um novo convite. Sair da conta
        Google é uma ação separada.
      </p>
      <button className="danger-action" disabled={saving} onClick={onLeave}>
        <LogOut size={17} />
        {saving ? "Saindo…" : "Sair da viagem"}
      </button>
    </Sheet>
  );
}
export function ImportTrip({
  trips,
  user,
  scope = "shared",
  api = liveApi,
  onImported,
  onClose,
}) {
  const [selected, setSelected] = useState(trips[0]?.id || ""),
    [person, setPerson] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const trip = trips.find((t) => t.id === selected);
  return (
    <Sheet title="Trazer uma viagem para sua conta" onClose={onClose}>
      <p className="field-help">
        Escolha uma viagem sua e identifique seu nome na divisão. A cópia
        original será preservada. Ninguém recebe acesso até você enviar um
        convite.
      </p>
      {trip ? (
        <form
          className="compact-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            try {
              const result = await api.createSharedTrip(
                { ...api.ledgerData(trip), id: crypto.randomUUID(), scope },
                person,
              );
              await onImported(result.id);
            } catch (err) {
              setError(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Viagem
            <select
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                setPerson("");
              }}
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quem é você nesta viagem?
            <select
              value={person}
              required
              onChange={(e) => setPerson(e.target.value)}
            >
              <option value="">Escolha seu nome</option>
              {trip.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <p className="field-help">
            Este participante ficará vinculado ao perfil {api.profileName(user)}
            .
          </p>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button className="primary-action" disabled={busy || !person}>
            {busy ? "Importando…" : "Importar para minha conta"}
          </button>
        </form>
      ) : (
        <p>Nenhuma viagem encontrada nesse arquivo ou aparelho.</p>
      )}
    </Sheet>
  );
}
