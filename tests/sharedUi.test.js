import { before, after, afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
let server,
  render,
  screen,
  within,
  waitFor,
  cleanup,
  React,
  TripView,
  AccountsView,
  CommunityView,
  userEvent,
  liveApi,
  dom;
const user = { id: "user-a", user_metadata: { full_name: "Luana França" } };
let trips, community, published, requests;
const baseTrip = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  name: "Bahia com amigas",
  people: [
    { id: "a", name: "Luana França" },
    { id: "b", name: "Bia" },
  ],
  expenses: [],
  version: 1,
  members: [{ user_id: "user-a", person_id: "a", name: "Luana França" }],
};
const api = {
  profileName: () => "Luana França",
  ledgerData: (t) => ({
    id: t.id,
    name: t.name,
    people: t.people,
    expenses: t.expenses,
    scope: t.scope || "shared",
  }),
  listSharedTrips: async () => structuredClone(trips),
  createSharedTrip: async (t) => {
    trips.push({ ...t, version: 1, members: baseTrip.members });
    return { id: t.id };
  },
  saveSharedTrip: async (t) => {
    requests.push(["save", t]);
    trips = trips.map((old) =>
      old.id === t.id ? { ...t, version: old.version + 1 } : old,
    );
  },
  inviteUrl: (token) => `https://rota-raiz.vercel.app/#join=${token}`,
  tripRpc: async (name, args) => {
    requests.push([name, args]);
    if (name === "rr_create_invite") return "ab".repeat(32);
    if (name === "rr_leave_trip") {
      trips = [];
      return;
    }
    if (name === "rr_preview_invite")
      return { name: "Viagem de Bia", inviter: "Bia", already_joined: false };
    if (name === "rr_join_trip") {
      trips = [structuredClone(baseTrip)];
      return { id: baseTrip.id };
    }
    throw new Error(name);
  },
};
const communityApi = {
  getRecommendations: async () => ({ available: true, items: community }),
  submitRecommendation: async (item) => {
    published = item;
    const row = {
      ...item,
      id: "new",
      user_id: user.id,
      author_name: "Luana França",
      created_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
    };
    community = [row, ...community];
    return row;
  },
};
before(async () => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
  });
  for (const key of [
    "window",
    "document",
    "HTMLElement",
    "HTMLDialogElement",
    "localStorage",
    "sessionStorage",
    "MutationObserver",
    "Node",
    "Event",
    "MouseEvent",
  ])
    globalThis[key] = dom.window[key];
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
  });
  globalThis.FormData = dom.window.FormData;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  React = await import("react");
  ({ render, screen, within, waitFor, cleanup } = await import(
    "@testing-library/react"
  ));
  userEvent = (await import("@testing-library/user-event")).default;
  server = await createServer({
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true },
    appType: "custom",
  });
  ({ default: AccountsView } = await server.ssrLoadModule("/src/components/AccountsView.jsx"));
  ({ default: TripView } = await server.ssrLoadModule(
    "/src/components/TripView.jsx",
  ));
  ({ default: CommunityView } = await server.ssrLoadModule(
    "/src/components/CommunityView.jsx",
  ));
  liveApi = await server.ssrLoadModule("/src/lib/sharedTrips.js");
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
after(async () => {
  await server.close();
  dom.window.close();
});
test("feed único mostra indicações de todos com autoria e publica sem aba separada", async () => {
  community = [
    {
      id: "one",
      name: "Praia de teste",
      category: "Praia",
      city: "Salvador",
      address: "Rua da praia",
      note: "Dica de Bia",
      author_name: "Bia",
      instagram: "",
    },
    {
      id: "two",
      name: "Restaurante de teste",
      category: "Comida",
      city: "Caraíva",
      address: "Rua do restaurante",
      note: "Dica de Luana",
      author_name: "Luana França",
      instagram: "",
    },
  ];
  render(
    React.createElement(CommunityView, {
      user,
      onRoute: () => {},
      api: communityApi,
    }),
  );
  await screen.findByRole("heading", { name: "Praia de teste" });
  assert.ok(screen.getByRole("heading", { name: "Restaurante de teste" }));
  assert.equal(
    screen.queryByRole("button", { name: /Minhas indicações/ }),
    null,
  );
  assert.ok(screen.getByText("Bia"));
  assert.ok(screen.getByText("Luana França"));
  const ui = userEvent.setup();
  await ui.click(screen.getByRole("button", { name: "Indicar lugar" }));
  await ui.type(screen.getByLabelText("Nome do lugar"), "Um novo lugar");
  await ui.type(screen.getByLabelText("Cidade e estado"), "João Pessoa, PB");
  await ui.type(screen.getByLabelText("Endereço completo"), "Rua pública, 10");
  await ui.type(screen.getByLabelText("Sua dica"), "Gostei e recomendo.");
  await ui.click(
    screen.getByRole("button", { name: "Publicar na comunidade" }),
  );
  await screen.findByRole("heading", { name: "Um novo lugar" });
  assert.equal(published.name, "Um novo lugar");
  assert.equal(
    published.author_name,
    undefined,
    "autoria não é enviada livremente pelo formulário",
  );
});
test("convite vincula a pessoa já cadastrada e sair deixa a tela vazia", async () => {
  trips = [structuredClone(baseTrip)];
  requests = [];
  render(React.createElement(TripView, { user, onOpenTour: () => {}, api }));
  await screen.findByText("Total da viagem");
  const ui = userEvent.setup();
  await ui.click(screen.getByRole("button", { name: "Convidar", exact: true }));
  const dialog = screen.getByRole("dialog");
  await ui.selectOptions(
    within(dialog).getByLabelText("Quem vai receber?"),
    "b",
  );
  await ui.click(
    within(dialog).getByRole("button", { name: "Gerar link de convite" }),
  );
  await screen.findByText("CONVITE PRONTO");
  assert.deepEqual(requests[0], [
    "rr_create_invite",
    { p_trip: baseTrip.id, p_person: "b" },
  ]);
  await ui.click(screen.getByRole("button", { name: "Fechar", exact: true }));
  await ui.click(
    screen.getByRole("button", { name: "Sair da viagem", exact: true }),
  );
  await ui.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Sair da viagem",
      exact: true,
    }),
  );
  await screen.findByRole("button", { name: "Criar minha viagem" });
  assert.equal(screen.queryByText("Total da viagem"), null);
});
test("convite exige aceitar, adiciona a viagem e consome o token", async () => {
  trips = [];
  requests = [];
  let consumed = false;
  render(
    React.createElement(TripView, {
      user,
      onOpenTour: () => {},
      api,
      inviteToken: "ab".repeat(32),
      onInviteHandled: () => {
        consumed = true;
      },
    }),
  );
  const ui = userEvent.setup();
  await ui.click(
    await screen.findByRole("button", { name: "Aceitar e entrar" }),
  );
  await screen.findByText("Total da viagem");
  assert.equal(consumed, true);
  assert.ok(requests.some((r) => r[0] === "rr_join_trip"));
});
test("convite é preservado antes do login e removido da URL", () => {
  window.history.replaceState(null, "", "/#join=" + "cd".repeat(32));
  assert.equal(liveApi.captureInvite(), "cd".repeat(32));
  assert.equal(window.location.hash, "");
  assert.equal(liveApi.captureInvite(), "cd".repeat(32));
  liveApi.clearInvite();
  assert.equal(liveApi.captureInvite(), null);
});
test("falha ao salvar mantém o formulário aberto e o gasto não é inventado localmente", async () => {
  trips = [structuredClone(baseTrip)];
  requests = [];
  const failing = {
    ...api,
    saveSharedTrip: async () => {
      throw new Error("A viagem foi atualizada por outra pessoa.");
    },
  };
  render(
    React.createElement(TripView, { user, onOpenTour: () => {}, api: failing }),
  );
  await screen.findByText("Total da viagem");
  const ui = userEvent.setup();
  await ui.click(
    screen.getByRole("button", { name: "Adicionar gasto", exact: true }),
  );
  await ui.type(screen.getByLabelText("Valor total (R$)"), "120,50");
  await ui.type(screen.getByLabelText("O que foi?"), "Almoço");
  await ui.click(screen.getByRole("button", { name: "Salvar gasto" }));
  await waitFor(() =>
    assert.ok(
      within(screen.getByRole("dialog"))
        .getByRole("alert")
        .textContent.includes("atualizada por outra pessoa"),
    ),
  );
  assert.equal(trips[0].expenses.length, 0);
});

test("cria viagem com o nome do perfil e salva na conta sem gravar os gastos no cache local", async () => {
  trips = [];
  requests = [];
  render(React.createElement(TripView, { user, onOpenTour: () => {}, api }));
  const ui = userEvent.setup();
  await ui.click(
    await screen.findByRole("button", { name: "Criar minha viagem" }),
  );
  await ui.type(
    screen.getByLabelText("Nome da viagem"),
    "Nova viagem da Luana",
  );
  await ui.click(
    screen.getByRole("button", { name: "Criar viagem", exact: true }),
  );
  await screen.findByText("Total da viagem");
  assert.equal(trips[0].people[0].name, "Luana França");
  assert.equal(localStorage.getItem("rotaraiz_trips_v1"), null);
});


test("Na conta separa individual do compartilhado e mantém convites fora do privado", async () => {
  trips = [structuredClone(baseTrip), {...structuredClone(baseTrip),id:"personal",scope:"individual",name:"Minhas passagens",people:[baseTrip.people[0]],expenses:[]}];
  render(React.createElement(AccountsView,{user,api}));
  await screen.findByRole("option",{name:"Minhas passagens"});
  assert.equal(screen.queryByRole("option",{name:"Bahia com amigas"}),null);
  assert.equal(screen.queryByRole("button",{name:"Convidar",exact:true}),null);
  assert.equal(screen.queryByText("Lugares salvos"),null);
  await userEvent.setup().click(screen.getByRole("button",{name:/Compartilhado/}));
  await screen.findByRole("option",{name:"Bahia com amigas"});
  assert.equal(screen.queryByRole("option",{name:"Minhas passagens"}),null);
  assert.ok(screen.getByRole("button",{name:"Convidar",exact:true}));
});

test("gasto compartilhado mostra a prévia exata da divisão", async () => {
  trips = [structuredClone(baseTrip)];
  render(React.createElement(TripView,{user,api}));
  await screen.findByText("Total da viagem");
  const ui=userEvent.setup();
  await ui.click(screen.getByRole("button",{name:"Adicionar gasto",exact:true}));
  await ui.type(screen.getByLabelText("Valor total (R$)"),"100,01");
  const preview=screen.getByLabelText("Prévia da divisão");
  assert.ok(preview.textContent.includes("50,01"));
  assert.ok(preview.textContent.includes("50,00"));
});

for (const scope of ["shared", "individual"]) test(`parcelamento cria, edita e exclui gasto ${scope} sem multiplicar total`, async () => {
  const record = {...structuredClone(baseTrip),scope};
  if (scope === "individual") record.people = [record.people[0]];
  trips = [record]; requests = [];
  render(React.createElement(TripView, {user,api,scope}));
  await screen.findByText("Total da viagem");
  const ui=userEvent.setup();
  await ui.click(screen.getByRole("button",{name:"Adicionar gasto",exact:true}));
  await ui.type(screen.getByLabelText("Valor total (R$)"),"100,01");
  await ui.type(screen.getByLabelText("O que foi?"),"Voo de teste");
  await ui.selectOptions(screen.getByLabelText("Categoria"),"Passagem de avião");
  await ui.click(screen.getByLabelText("Gasto parcelado"));
  const quantity=screen.getByLabelText("Quantidade de parcelas");
  await ui.clear(quantity); await ui.type(quantity,"3");
  assert.ok(screen.getByRole("status").textContent.includes("33,34"));
  await ui.click(screen.getByRole("button",{name:"Salvar gasto"}));
  await waitFor(()=>assert.equal(screen.queryByRole("dialog"),null));
  assert.equal(trips[0].expenses[0].installments,3);
  assert.equal(trips[0].expenses[0].amount,10001);
  assert.equal(Object.values(trips[0].expenses[0].shares).reduce((a,b)=>a+b,0),10001);
  await ui.click(screen.getByRole("button",{name:/Voo de teste/}));
  assert.equal(screen.getByLabelText("Quantidade de parcelas").value,"3");
  await ui.click(screen.getByLabelText("Gasto parcelado"));
  await ui.click(screen.getByRole("button",{name:"Salvar gasto"}));
  await waitFor(()=>assert.equal(screen.queryByRole("dialog"),null));
  assert.equal(trips[0].expenses[0].installments,1);
  await ui.click(screen.getByRole("button",{name:/Voo de teste/}));
  const original=window.confirm; window.confirm=()=>true;
  try {await ui.click(screen.getByRole("button",{name:"Excluir gasto"}));}
  finally {window.confirm=original;}
  await waitFor(()=>assert.equal(trips[0].expenses.length,0));
});
