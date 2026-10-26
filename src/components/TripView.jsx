import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  Wallet,
  Users,
  Download,
  Upload,
  ArrowUpRight,
  Trash2,
  FileText,
  Pencil,
  UserPlus,
  LogOut,
} from "lucide-react";
import Sheet from "./Sheet";
import useSharedTrips from "../hooks/useSharedTrips";
import * as liveApi from "../lib/sharedTrips";
import { TripInvite, JoinTrip, LeaveTrip, ImportTrip } from "./TripSharing";
import {
  CATEGORIES,
  money,
  parseMoney,
  splitAmount,
  summarize,
  validateTrips,
  downloadJson,
} from "../lib/tripLedger";
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export default function TripView({
  user,
  inviteToken,
  onInviteHandled,
  api = liveApi,
  scope = "shared",
}) {
  const {
    trips,
    active,
    setActive,
    loading,
    saving,
    error,
    setError,
    persist,
    refresh,
    leave,
  } = useSharedTrips(user, api, scope);
  const [sheet, setSheet] = useState(null),
    [notice, setNotice] = useState(""),
    [pdfBusy, setPdfBusy] = useState(false);
  const file = useRef(null),
    trip = trips.find((t) => t.id === active),
    stats = trip ? summarize(trip) : null;
  const shared = scope === "shared";
  const myPerson = trip?.members?.find(member => member.user_id === user.id)?.person_id;
  const myStats = stats?.people.find(person => person.id === myPerson);
  useEffect(() => {
    if (
      !loading &&
      sheet &&
      ["expense", "people", "invite", "rename", "leave", "report"].includes(
        sheet.type,
      ) &&
      !trip
    )
      setSheet(null);
  }, [trip, loading, sheet]);
  function openLegacy() {
    try {
      const legacy = validateTrips(
        JSON.parse(localStorage.getItem("rotaraiz_trips_v1") || "[]"),
      );
      setSheet({ type: "import", trips: legacy });
    } catch {
      setError(
        "Não foi possível ler as viagens anteriores. Você pode importar uma cópia JSON.",
      );
    }
  }
  async function exportPdf() {
    if (!trip || pdfBusy) return;
    setPdfBusy(true);
    setError("");
    try {
      const { downloadTripPdf } = await import("../lib/tripReportPdf");
      downloadTripPdf(trip);
    } catch {
      setError(
        "Não foi possível gerar o PDF. Tente novamente; seus gastos continuam salvos.",
      );
    } finally {
      setPdfBusy(false);
    }
  }
  function update(next) {
    return persist(trips.map((t) => (t.id === next.id ? next : t)));
  }
  async function restore(e) {
    const f = e.target.files[0];
    if (!f) return;
    try {
      if (f.size > 5000000) throw new Error("O arquivo deve ter até 5 MB.");
      const data = JSON.parse(await f.text());
      if (data.version !== 1)
        throw new Error("Formato de cópia não reconhecido.");
      const incoming = validateTrips(data.trips);
      setSheet({ type: "import", trips: incoming });
    } catch (err) {
      setError(err.message);
    }
    e.target.value = "";
  }
  return (
    <div className="travel-page">
      <div className="travel-heading">
        <div>
          <h2>{shared ? "Gastos do grupo" : "Seus gastos"}</h2>
          <p>{shared ? "Cada gasto às claras. A divisão fica mais fácil." : "Seus gastos pessoais, só para você."}</p>
        </div>
        <button
          className="small-action"
          aria-label="Nova viagem"
          title="Nova viagem"
          onClick={() => setSheet({ type: "trip" })}
        >
          <Plus size={18} /> <span>Nova viagem</span>
        </button>
      </div>
      {inviteToken && (
        <JoinTrip
          token={inviteToken}
          api={api}
          onDismiss={onInviteHandled}
          onJoined={async (id) => {
            await refresh(true);
            setActive(id);
            onInviteHandled();
          }}
        />
      )}
      {loading && <p role="status">Carregando suas viagens…</p>}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {trips.length > 0 && (
        <label className="trip-select">
          Sua viagem
          <select
            value={active || ""}
            onChange={(e) => setActive(e.target.value)}
          >
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {!loading && !trip ? (
        <section className="travel-empty">
          <Wallet size={32} />
          <h2>{shared ? "As contas também vão juntas." : "Sua viagem, suas contas."}</h2>
          <p>
            {shared ? "Crie o grupo, convide quem vai junto e registrem os gastos. No final, vejam quem deve a quem." : "Registre passagens, hospedagem, refeições e tudo o que sair do seu bolso. Este espaço é privado."}
          </p>
          <button
            className="primary-action"
            onClick={() => setSheet({ type: "trip" })}
          >
            Criar minha viagem <Plus size={18} />
          </button>
          <button
            className="small-action legacy-empty-action"
            onClick={openLegacy}
          >
            Trazer uma viagem deste aparelho
          </button>
        </section>
      ) : trip ? (
        <>
          <section className="trip-overview">
            <div>
              <span>Total da viagem</span>
              <strong>{money(stats.total)}</strong>
              <small>
                {trip.expenses.length} despesas · {trip.people.length}{" "}
                {trip.people.length === 1 ? "participante" : "participantes"}
              </small>
            </div>
            <button
              className="primary-action"
              aria-label="Adicionar gasto"
              onClick={() => setSheet({ type: "expense", snapshot: trip })}
            >
              <Plus size={18} />{" "}
              <span className="wide-label">Adicionar gasto</span>
              <span className="short-label">Gasto</span>
            </button>
          </section>
          <p className="finance-sync-note">{shared ? "Todos os convidados podem ver e registrar gastos. Atualização automática a cada 8 segundos com esta tela aberta." : "Estes gastos ficam na sua conta e não aparecem para os grupos."}</p>
          {shared && myStats && <div className="finance-my-summary"><span>Você pagou <b>{money(myStats.paid)}</b></span><span>Sua parte <b>{money(myStats.share)}</b></span><span>{myStats.balance > 0 ? "A receber" : myStats.balance < 0 ? "A acertar" : "Em dia"} <b>{money(Math.abs(myStats.balance))}</b></span></div>}
          <div className="trip-actions">
            <button disabled={loading || saving} onClick={() => refresh()} aria-label="Atualizar gastos">Atualizar</button>
            {shared && <button onClick={() => setSheet({ type: "invite" })}>
              <UserPlus size={17} /> Convidar
            </button>}
            {shared && <button onClick={() => setSheet({ type: "people" })}>
              <Users size={17} /> Pessoas
            </button>}
            <button onClick={() => setSheet({ type: "report" })}>
              <FileText size={17} /> Relatório
            </button>
            <button
              aria-label="Renomear viagem"
              onClick={() => setSheet({ type: "rename" })}
            >
              <Pencil size={17} />
            </button>
            {shared && <button
              aria-label="Sair da viagem"
              onClick={() => setSheet({ type: "leave" })}
            >
              <LogOut size={17} />
            </button>}
          </div>
          <div className="trip-columns">
            <section>
              <div className="section-heading">
                <h2>Gastos do caminho</h2>
                <span>
                  {stats.days
                    ? `${stats.days} ${stats.days === 1 ? "dia" : "dias"} entre registros`
                    : "Comece por aqui"}
                </span>
              </div>
              {!trip.expenses.length && (
                <p className="quiet-empty">
                  Seu primeiro almoço, passagem ou passeio aparece aqui.
                </p>
              )}
              {[...trip.expenses]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((e, i, all) => (
                  <React.Fragment key={e.id}>
                    {(i === 0 || all[i - 1].date !== e.date) && (
                      <h3 className="expense-day">
                        {new Date(e.date + "T12:00:00").toLocaleDateString(
                          "pt-BR",
                          { day: "numeric", month: "long", year: "numeric" },
                        )}
                      </h3>
                    )}
                    <button
                      className="expense-row"
                      onClick={() =>
                        setSheet({
                          type: "expense",
                          expense: e,
                          snapshot: trip,
                        })
                      }
                    >
                      <span className="expense-symbol">
                        <Wallet size={18} />
                      </span>
                      <span>
                        <b>{e.description}</b>
                        <small>
                          {e.category} ·{" "}
                          {trip.people.find((p) => p.id === e.payer)?.name}{" "}
                          pagou
                        </small>
                      </span>
                      <strong>{money(e.amount)}</strong>
                      <ArrowUpRight size={16} />
                    </button>
                  </React.Fragment>
                ))}
            </section>
            <section className="trip-breakdown">
              <h2>Onde foi o dinheiro</h2>
              {!stats.total ? (
                <p>O resumo aparece conforme você registra os gastos.</p>
              ) : (
                Object.entries(stats.categories)
                  .filter(([, v]) => v > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([c, v]) => (
                    <div className="category-total" key={c}>
                      <span>{c}</span>
                      <b>{money(v)}</b>
                      <meter
                        min="0"
                        max={stats.total}
                        value={v}
                        aria-label={`${c}: ${money(v)}`}
                      />
                    </div>
                  ))
              )}
              {shared && <details className="settlement">
                <summary>Acertos entre as pessoas</summary>
                <p>Proposta de divisão. Não registra pagamentos de acerto.</p>
                {stats.settlements.map((s, i) => (
                  <p key={i}>
                    <b>{s.from}</b> → {s.to} <strong>{money(s.amount)}</strong>
                  </p>
                ))}
                {!stats.settlements.length && <p>Nenhum acerto pendente.</p>}
              </details>}
            </section>
          </div>
        </>
      ) : null}
      {trip && (
        <div className="trip-report-download">
          <button
            className="primary-action"
            disabled={pdfBusy}
            onClick={exportPdf}
          >
            <Download size={17} />
            {pdfBusy ? "Gerando PDF…" : "Baixar relatório em PDF"}
          </button>
          <p>Resumo visual da viagem, categorias, participantes e acertos.</p>
        </div>
      )}
      <details className="trip-storage">
        <summary>Cópia de segurança e restauração</summary>
        <p>
          {shared ? "Os gastos ficam na sua conta e são atualizados entre os participantes. Para compartilhar o acesso, use Convidar." : "Os gastos ficam privados na sua conta."} O backup JSON é uma cópia dos dados; para um documento visual, use Baixar relatório em PDF.
        </p>
        <div>
          <button onClick={openLegacy}>
            Trazer viagens anteriores deste aparelho
          </button>
          <button
            disabled={!trips.length}
            onClick={() =>
              downloadJson("rota-raiz-viagens.json", { version: 1, trips })
            }
          >
            <Download size={16} /> Backup dos dados (.json)
          </button>
          <button onClick={() => file.current.click()}>
            <Upload size={16} /> Importar backup JSON
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={restore}
          />
        </div>
      </details>
      {sheet?.type === "import" && (
        <ImportTrip
          trips={sheet.trips}
          user={user}
          scope={scope}
          api={api}
          onClose={() => setSheet(null)}
          onImported={async (id) => {
            await refresh(true);
            setActive(id);
            setSheet(null);
            setNotice(
              "Viagem importada para sua conta. A cópia anterior foi preservada.",
            );
          }}
        />
      )}
      {sheet?.type === "invite" && trip && (
        <TripInvite trip={trip} api={api} onClose={() => setSheet(null)} />
      )}
      {sheet?.type === "leave" && trip && (
        <LeaveTrip
          trip={trip}
          saving={saving}
          onClose={() => setSheet(null)}
          onLeave={async () => {
            if (await leave(trip.id)) {
              setSheet(null);
              setNotice(
                "Você saiu da viagem. O histórico continua com os outros participantes.",
              );
            }
          }}
        />
      )}
      {sheet?.type === "trip" && (
        <Sheet title="Uma nova viagem" onClose={() => setSheet(null)}>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <form
            className="compact-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget),
                id = crypto.randomUUID();
              if (
                await persist([
                  ...trips,
                  {
                    id,
                    name: f.get("name").trim(),
                    scope,
                    people: [
                      { id: crypto.randomUUID(), name: f.get("person").trim() },
                    ],
                    expenses: [],
                  },
                ])
              ) {
                setActive(id);
                setSheet(null);
              }
            }}
          >
            <label>
              Nome da viagem
              <input
                name="name"
                maxLength={100}
                required
                placeholder="Bahia e João Pessoa"
              />
            </label>
            <p className="field-help">
              Você participa como <b>{api.profileName(user)}</b>.
            </p>
            <input type="hidden" name="person" value={api.profileName(user)} />
            <button className="primary-action" disabled={saving}>
              {saving ? "Criando…" : "Criar viagem"}
            </button>
          </form>
        </Sheet>
      )}
      {sheet?.type === "rename" && (
        <Sheet title="Nome da viagem" onClose={() => setSheet(null)}>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <form
            className="compact-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await update({
                  ...trip,
                  name: new FormData(e.currentTarget).get("name").trim(),
                })
              )
                setSheet(null);
            }}
          >
            <label>
              Nome
              <input
                name="name"
                required
                maxLength={100}
                defaultValue={trip.name}
              />
            </label>
            <button className="primary-action" disabled={saving}>
              Salvar nome
            </button>
          </form>
        </Sheet>
      )}
      {sheet?.type === "people" && (
        <People
          trip={trip}
          saving={saving}
          syncError={error}
          update={update}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.type === "expense" && (
        <Expense
          saving={saving}
          syncError={error}
          individual={!shared}
          trip={sheet.snapshot || trip}
          expense={sheet.expense}
          update={update}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.type === "report" && (
        <Sheet
          title="Resumo da viagem"
          className="trip-report-dialog"
          onClose={() => setSheet(null)}
        >
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="primary-action no-print"
            disabled={pdfBusy}
            onClick={exportPdf}
          >
            <Download size={17} />{" "}
            {pdfBusy ? "Gerando PDF…" : "Baixar relatório em PDF"}
          </button>
          <p className="no-print">
            Arquivo PDF com resumo visual e despesas detalhadas, pronto para
            guardar ou compartilhar.
          </p>
          <article id="trip-report">
            <span className="eyebrow">ROTA RAIZ · RELATÓRIO</span>
            <h2>{trip.name}</h2>
            <strong className="report-total">{money(stats.total)}</strong>
            <p>
              {trip.expenses.length} despesas · {stats.days}{" "}
              {stats.days === 1 ? "dia" : "dias"} entre primeiro e último
              registro
            </p>
            {stats.days > 0 && (
              <p>Média por dia nesse período: {money(stats.average)}</p>
            )}
            <h3>Por categoria</h3>
            {Object.entries(stats.categories)
              .filter(([, v]) => v)
              .sort((a, b) => b[1] - a[1])
              .map(([c, v]) => (
                <p className="report-line" key={c}>
                  <span>
                    {c} · {Math.round((v / stats.total) * 100)}%
                  </span>
                  <b>{money(v)}</b>
                </p>
              ))}
            <h3>Por pessoa</h3>
            {stats.people.map((p) => (
              <div key={p.id}>
                <b>{p.name}</b>
                <p>
                  Pagou {money(p.paid)} · sua parte {money(p.share)}
                </p>
              </div>
            ))}
            <h3>Acertos sugeridos</h3>
            {stats.settlements.map((s, i) => (
              <p key={i}>
                {s.from} → {s.to}: <b>{money(s.amount)}</b>
              </p>
            ))}
            {!stats.settlements.length && <p>Nenhum acerto pendente.</p>}
            <p>
              Os acertos são calculados pelas despesas; transferências de
              quitação não estão registradas.
            </p>
            <h3>Despesas registradas</h3>
            {trip.expenses.map((e) => (
              <p className="report-line" key={e.id}>
                <span>
                  {e.date.split("-").reverse().join("/")} · {e.description} ·{" "}
                  {e.category} ·{" "}
                  {trip.people.find((p) => p.id === e.payer)?.name}
                </span>
                <b>{money(e.amount)}</b>
              </p>
            ))}
          </article>
        </Sheet>
      )}
    </div>
  );
}
function People({ trip, update, onClose, saving, syncError }) {
  const [error, setError] = useState("");
  return (
    <Sheet title="Quem vai junto" onClose={onClose}>
      <div className="people-list">
        {trip.people.map((p) => (
          <div key={p.id}>
            <b>{p.name}</b>
            <button
              className="icon-button"
              aria-label={`Remover ${p.name}`}
              disabled={
                trip.people.length === 1 ||
                saving ||
                trip.members?.some((m) => m.person_id === p.id) ||
                trip.expenses.some(
                  (e) => e.payer === p.id || Object.hasOwn(e.shares, p.id),
                )
              }
              onClick={async () =>
                await update({
                  ...trip,
                  people: trip.people.filter((x) => x.id !== p.id),
                })
              }
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
      <p className="field-help">
        Pessoas com despesas ficam no histórico. Adicionar um nome organiza a
        divisão; use Convidar para a pessoa entrar com sua conta.
      </p>
      <form
        className="compact-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const name = new FormData(form).get("name").trim();
          if (!name) return;
          if (
            trip.people.some(
              (p) => p.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
            )
          ) {
            setError("Essa pessoa já está na viagem.");
            return;
          }
          if (
            await update({
              ...trip,
              people: [...trip.people, { id: crypto.randomUUID(), name }],
            })
          ) {
            form.reset();
            setError("");
          } else setError("Não foi possível sincronizar a alteração.");
        }}
      >
        <label>
          Adicionar pessoa
          <input name="name" required maxLength={60} placeholder="Nome" />
        </label>
        {(syncError || error) && <p role="alert">{syncError || error}</p>}
        <button
          className="primary-action"
          disabled={saving || trip.people.length >= 50}
        >
          Adicionar pessoa
        </button>
      </form>
    </Sheet>
  );
}
function Expense({ trip, expense, update, onClose, saving, syncError, individual }) {
  const [amountInput, setAmountInput] = useState(expense ? String(expense.amount / 100) : "");
  let preview = {};
  const [selected, setSelected] = useState(
      expense ? Object.keys(expense.shares) : trip.people.map((p) => p.id),
    ),
    [custom, setCustom] = useState(
      expense
        ? expense.splitMode === "custom" ||
            (!expense.splitMode &&
              JSON.stringify(expense.shares) !==
                JSON.stringify(
                  splitAmount(expense.amount, Object.keys(expense.shares)),
                ))
        : false,
    ),
    [error, setError] = useState("");
  try { if (!custom && selected.length) preview = splitAmount(parseMoney(amountInput), selected); } catch { /* valor ainda em digitação */ }
  async function submit(e) {
    e.preventDefault();
    try {
      const f = new FormData(e.currentTarget),
        amount = parseMoney(f.get("amount"));
      let shares = splitAmount(amount, selected);
      if (custom) {
        shares = Object.fromEntries(
          selected.map((id) => {
            const raw = f.get("share-" + id);
            return [
              id,
              raw === "0" || raw === "0,00" || raw === "0.00"
                ? 0
                : parseMoney(raw),
            ];
          }),
        );
        if (Object.values(shares).reduce((a, b) => a + b, 0) !== amount)
          throw new Error(
            "As partes precisam somar exatamente o valor do gasto.",
          );
      }
      const item = {
        id: expense?.id || crypto.randomUUID(),
        description: f.get("description").trim(),
        amount,
        category: f.get("category"),
        payer: f.get("payer"),
        date: f.get("date"),
        shares,
        splitMode: custom ? "custom" : "equal",
      };
      const expenses = expense
        ? trip.expenses.map((x) => (x.id === expense.id ? item : x))
        : [...trip.expenses, item];
      if (await update({ ...trip, expenses })) onClose();
      else
        setError(
          "Não foi possível salvar. Se outra pessoa atualizou a conta, feche este formulário e abra o gasto novamente para conferir a divisão.",
        );
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <Sheet
      title={expense ? "Editar gasto" : "Adicionar gasto"}
      onClose={onClose}
    >
      <form className="compact-form" onSubmit={submit}>
        <div className="form-pair">
          <label>
            Valor (R$)
            <input
              name="amount"
              onChange={event => setAmountInput(event.target.value)}
              inputMode="decimal"
              required
              defaultValue={
                expense
                  ? (expense.amount / 100).toFixed(2).replace(".", ",")
                  : ""
              }
              placeholder="0,00"
            />
          </label>
          <label>
            Data
            <input
              name="date"
              type="date"
              required
              defaultValue={expense?.date || today()}
            />
          </label>
        </div>
        <label>
          O que foi?
          <input
            name="description"
            required
            maxLength={160}
            defaultValue={expense?.description}
            placeholder="Almoço na praia"
          />
        </label>
        <div className="form-pair">
          <label>
            Categoria
            <select
              name="category"
              defaultValue={expense?.category || CATEGORIES[0]}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Quem pagou?
            <select
              name="payer"
              defaultValue={expense?.payer || trip.people[0].id}
            >
              {trip.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!individual && <fieldset>
          <legend>Dividir com quem?</legend>
          <div className="person-options">
            {trip.people.map((p) => (
              <label key={p.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, p.id]
                        : selected.filter((id) => id !== p.id),
                    )
                  }
                />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>}
        {!individual && <label className="check-row">
          <input
            type="checkbox"
            checked={custom}
            onChange={(e) => setCustom(e.target.checked)}
          />{" "}
          Ajustar valores por pessoa
        </label>}
        {custom ? (
          selected.map((id) => (
            <label key={id}>
              {trip.people.find((p) => p.id === id).name} (R$)
              <input
                name={"share-" + id}
                inputMode="decimal"
                required
                defaultValue={
                  expense?.shares[id] != null
                    ? (expense.shares[id] / 100).toFixed(2).replace(".", ",")
                    : ""
                }
                placeholder="0,00"
              />
            </label>
          ))
        ) : (
          <p className="field-help">
            {individual ? "Gasto pessoal: o valor fica todo na sua conta." : "Divisão igual. Centavos restantes são distribuídos na ordem selecionada."}
          </p>
        )}
        {!individual && !custom && Object.keys(preview).length > 0 && <div className="expense-split-preview" aria-label="Prévia da divisão"><strong>Como fica para cada um</strong>{selected.map(id => <p key={id}><span>{trip.people.find(person => person.id === id)?.name}</span><b>{money(preview[id])}</b></p>)}</div>}
        {(syncError || error) && (
          <p className="form-error" role="alert">
            {syncError || error}
          </p>
        )}
        <button className="primary-action" disabled={saving}>
          {saving ? "Salvando…" : "Salvar gasto"}
        </button>
        {expense && (
          <button
            type="button"
            disabled={saving}
            className="danger-action"
            onClick={async () => {
              if (
                window.confirm("Excluir esta despesa?") &&
                (await update({
                  ...trip,
                  expenses: trip.expenses.filter((x) => x.id !== expense.id),
                }))
              )
                onClose();
            }}
          >
            <Trash2 size={16} /> Excluir gasto
          </button>
        )}
      </form>
    </Sheet>
  );
}
