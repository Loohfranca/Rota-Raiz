import { before, after, afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
const originalFetch = globalThis.fetch;
let server,
  render,
  screen,
  cleanup,
  React,
  WalkingJourney,
  JourneyLookup,
  RoutesView,
  TourDetailView,
  BrazilDiscovery,
  ToursView,
  ExploreHero,
  ItineraryView,
  useItineraries,
  LegEditor,
  SavePlaceSheet,
  userEvent,
  dom;
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
  globalThis.SVGElement = dom.window.SVGElement;
  globalThis.getComputedStyle = dom.window.getComputedStyle;
  globalThis.FormData = dom.window.FormData;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  React = await import("react");
  ({ render, screen, cleanup } = await import("@testing-library/react"));
  userEvent = (await import("@testing-library/user-event")).default;
  server = await createServer({
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true },
    appType: "custom",
  });
  dom.window.SVGSVGElement.prototype.createSVGRect = () => ({});
  ({ default: WalkingJourney } = await server.ssrLoadModule(
    "/src/components/WalkingJourney.jsx",
  ));
  ({ default: JourneyLookup } = await server.ssrLoadModule(
    "/src/components/JourneyLookup.jsx",
  ));
  ({ default: RoutesView } = await server.ssrLoadModule(
    "/src/components/RoutesView.jsx",
  ));
  ({ default: TourDetailView } = await server.ssrLoadModule(
    "/src/components/TourDetailView.jsx",
  ));
  ({ default: BrazilDiscovery } = await server.ssrLoadModule(
    "/src/components/BrazilDiscovery.jsx",
  ));
  ({ default: useItineraries } = await server.ssrLoadModule("/src/hooks/useItineraries.js"));
  ({ default: ItineraryView, LegEditor, SavePlaceSheet } = await server.ssrLoadModule("/src/components/ItineraryView.jsx"));
  ({ default: ExploreHero } = await server.ssrLoadModule("/src/components/ExploreHero.jsx"));
  ({ default: ToursView } = await server.ssrLoadModule(
    "/src/components/ToursView.jsx",
  ));
});
afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  localStorage.clear();
  sessionStorage.clear();
});
after(async () => {
  await server.close();
  dom.window.close();
});

const origin = { name: "Minha origem", lat: -22.9, lng: -43.2 };
const destination = {
  name: "Restaurante indicado",
  lat: -22.901,
  lng: -43.201,
};
function encode(points) {
  let previous = [0, 0],
    s = "";
  for (const p of points)
    for (let i = 0; i < 2; i++) {
      const n = Math.round(p[i] * 1e6),
        delta = n - previous[i];
      previous[i] = n;
      let v = delta < 0 ? ~(delta << 1) : delta << 1;
      while (v >= 32) {
        s += String.fromCharCode((32 | (v & 31)) + 63);
        v >>= 5;
      }
      s += String.fromCharCode(v + 63);
    }
  return s;
}
function response() {
  return {
    ok: true,
    json: async () => ({
      trip: {
        status: 0,
        summary: { length: 1.2, time: 900 },
        legs: [
          {
            shape: encode([
              [-22.9, -43.2],
              [-22.901, -43.201],
            ]),
            maneuvers: [{ instruction: "Siga pela Rua de Teste", length: 1.2 }],
          },
        ],
      },
    }),
  };
}
test("A pé abre mapa, distância e instruções no app sem navegar para link externo", async () => {
  let body;
  globalThis.fetch = async (url, opts) => {
    assert.match(String(url), /valhalla/);
    body = JSON.parse(opts.body);
    return response();
  };
  render(
    React.createElement(JourneyLookup, {
      origin,
      destination,
      uncovered: true,
    }),
  );
  const ui = userEvent.setup();
  await ui.click(screen.getByRole("button", { name: /Consultar como chegar/ }));
  assert.equal(screen.queryByRole("link", { name: "A pé" }), null);
  await ui.click(screen.getByRole("button", { name: "A pé" }));
  await ui.click(
    screen.getByRole("button", { name: "Ver caminhada aqui no Rota Raiz" }),
  );
  await screen.findByText(/Siga pela Rua de Teste/);
  assert.equal(body.costing, "pedestrian");
  assert.ok(screen.getByText(/aproximadamente/).textContent.includes("15"));
  assert.ok(document.querySelector(".leaflet-container"));
  assert.ok(document.querySelector(".leaflet-overlay-pane path"));
  assert.ok(
    screen.getByText("Ver instruções da caminhada").closest("details").open,
  );
});
test("endereço ambíguo exige escolha e transmite o ponto escolhido ao cálculo", async () => {
  const places = [
    {
      id: "a",
      name: "Lugar A",
      address: "Rua A, Salvador, BA",
      lat: -12.9,
      lng: -38.5,
    },
    {
      id: "b",
      name: "Lugar B",
      address: "Rua B, Salvador, BA",
      lat: -12.91,
      lng: -38.51,
    },
  ];
  let received;
  function Panel(props) {
    received = props;
    return React.createElement("p", null, "Rota interna pronta");
  }
  render(
    React.createElement(WalkingJourney, {
      origin,
      destination: { name: "Restaurante" },
      search: async () => places,
      RoutePanel: Panel,
    }),
  );
  await screen.findByRole("button", { name: /Lugar B/ });
  assert.equal(screen.queryByText("Rota interna pronta"), null);
  const ui = userEvent.setup();
  await ui.click(screen.getByRole("button", { name: /Lugar B/ }));
  await screen.findByText("Rota interna pronta");
  assert.equal(received.tour.lat, places[1].lat);
  assert.equal(received.autoCalculate, true);
  await ui.type(screen.getByLabelText("Destino"), " alterado");
  assert.equal(screen.queryByText("Rota interna pronta"), null);
});
test("falha de roteamento exibe erro e permite tentar de novo sem inventar trajeto", async () => {
  globalThis.fetch = async () => ({ ok: false });
  render(React.createElement(WalkingJourney, { origin, destination }));
  await screen.findByRole("alert");
  assert.equal(document.querySelector(".leaflet-container"), null);
  globalThis.fetch = async () => response();
  const ui = userEvent.setup();
  await ui.click(
    screen.getByRole("button", { name: "Calcular percurso a pé" }),
  );
  await screen.findByText(/Siga pela Rua de Teste/);
});

test("Ver como ir abre o painel direto com origem e destino livres e troca o modo do Maps", async () => {
  const from = { name: "Praça XV, Rio de Janeiro, RJ" };
  const to = { name: "Praça Mauá, Rio de Janeiro, RJ" };
  render(
    React.createElement(RoutesView, {
      origin: from,
      onChangeOrigin: () => {},
      initialDestination: to,
    }),
  );
  await screen.findByDisplayValue(to.name);
  const ui = userEvent.setup();
  await ui.click(screen.getByRole("button", { name: "Ver como ir" }));
  await screen.findByRole("dialog", { name: "Escolha como ir" });
  let link = screen.getByRole("link", { name: "Continuar no Google Maps" });
  let url = new URL(link.href);
  assert.equal(url.searchParams.get("origin"), from.name);
  assert.equal(url.searchParams.get("destination"), to.name);
  assert.equal(url.searchParams.get("travelmode"), "transit");
  for (const [label, mode] of [
    ["A pé", "walking"],
    ["Carro / táxi", "driving"],
    ["Bicicleta", "bicycling"],
  ]) {
    await ui.click(screen.getByRole("button", { name: label, exact: true }));
    assert.equal(new URL(link.href).searchParams.get("travelmode"), mode);
    assert.equal(
      screen
        .getByRole("button", { name: label, exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
  }
  await ui.click(screen.getByRole("button", { name: "Fechar", exact: true }));
  assert.equal(screen.queryByRole("dialog"), null);
  assert.equal(screen.getByLabelText("Destino").value, to.name);
});
test("passo a passo offline é recolhido e informa limites sem fingir que baixou o mapa", async () => {
  render(
    React.createElement(JourneyLookup, {
      origin,
      destination,
      defaultOpen: true,
      hideTrigger: true,
    }),
  );
  const title = screen.getByText("Antes de sair, baixe a área");
  const details = title.closest("details");
  assert.equal(details.open, false);
  const ui = userEvent.setup();
  await ui.click(title);
  assert.equal(details.open, true);
  assert.ok(screen.getByText("Mapas off-line"));
  assert.ok(
    screen.getByText(/Ônibus, bicicleta e caminhada precisam de internet/),
  );
  assert.ok(screen.getByText(/não baixa nem confirma esse download/));
  assert.match(
    screen.getByRole("link", { name: "Ver a orientação do Google" }).href,
    /support.google.com/,
  );
});
test("origem ou destino vazios não abrem um link de rota incompleto", async () => {
  render(
    React.createElement(RoutesView, { origin: null, onChangeOrigin: () => {} }),
  );
  const ui = userEvent.setup();
  await ui.click(screen.getByRole("button", { name: "Ver como ir" }));
  assert.ok(screen.getByText("Preencha de onde você sai e para onde vai."));
  assert.equal(screen.queryByRole("dialog"), null);
});

test("modo restrito acompanha a troca entre transporte público e bicicleta", async () => {
  const view = render(
    React.createElement(JourneyLookup, {
      origin,
      destination,
      modes: ["transit"],
      defaultOpen: true,
    }),
  );
  assert.equal(
    new URL(
      screen.getByRole("link", { name: "Continuar no Google Maps" }).href,
    ).searchParams.get("travelmode"),
    "transit",
  );
  view.rerender(
    React.createElement(JourneyLookup, {
      origin,
      destination,
      modes: ["bicycling"],
      defaultOpen: true,
    }),
  );
  assert.equal(
    new URL(
      screen.getByRole("link", { name: "Continuar no Google Maps" }).href,
    ).searchParams.get("travelmode"),
    "bicycling",
  );
  assert.equal(
    screen
      .getByRole("button", { name: "Bicicleta", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
});

test("praia sem coordenada abre busca pelo endereço em vez de criar mapa com pino inválido", async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => [] });
  const oldOpen = window.open,
    oldScroll = window.scrollTo;
  let opened;
  window.open = (url) => {
    opened = url;
  };
  window.scrollTo = () => {};
  try {
    const { CARAIVA_BEACHES } = await server.ssrLoadModule(
      "/src/data/caraivaBeaches.js",
    );
    const tour = CARAIVA_BEACHES.find((i) => i.id === "caraiva-barra");
    render(
      React.createElement(TourDetailView, {
        tour,
        home: origin,
        onBack: () => {},
        onSwitchToRoute: () => {},
        onOpenMapWithTour: () => {
          throw Error("Não abrir mapa sem coordenada");
        },
      }),
    );
    const ui = userEvent.setup();
    await ui.click(screen.getByRole("button", { name: "Ver no mapa" }));
    assert.equal(new URL(opened).searchParams.get("query"), tour.address);
  } finally {
    window.open = oldOpen;
    window.scrollTo = oldScroll;
  }
});

test("buscar atrações em outra cidade atualiza o link sem consumir serviço enquanto digita", async () => {
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    throw Error("Não consultar API");
  };
  render(React.createElement(BrazilDiscovery));
  assert.ok(
    screen.getByRole("button", { name: "Buscar no Google Maps" }).disabled,
  );
  const ui = userEvent.setup();
  await ui.type(screen.getByLabelText("Cidade ou região"), "Bonito, MS");
  await ui.selectOptions(
    screen.getByLabelText("O que descobrir"),
    "waterfalls",
  );
  const link = screen.getByRole("link", { name: "Buscar no Google Maps" });
  assert.equal(
    new URL(link.href).searchParams.get("query"),
    "cachoeiras em Bonito, MS, Brasil",
  );
  assert.equal(link.target, "_blank");
  assert.equal(requests, 0);
  assert.ok(screen.getByText(/não são importados para o catálogo/));
});
test("Explorar mostra Trancoso e abre seis lugares cadastrados nessa região", async () => {
  const oldScroll = window.scrollTo;
  window.scrollTo = () => {};
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  globalThis.cancelAnimationFrame = clearTimeout;
  try {
    render(
      React.createElement(ToursView, {
        home: { name: "Trancoso", lat: -16.5901, lng: -39.0975 },
        onChangeHome: () => {},
        onSelectTour: () => {},
        onRoute: () => {},
      }),
    );
    const ui = userEvent.setup();
    await ui.click(
      await screen.findByRole("button", { name: "Trancoso", exact: true }),
    );
    await screen.findByRole("heading", { name: "Explore Trancoso" });
    await screen.findByRole("heading", { name: "Quadrado de Trancoso" });
    assert.ok(screen.getByRole("heading", { name: "Praia dos Coqueiros" }));
    assert.ok(screen.getByRole("heading", { name: "Praia de Itapororoca" }));
    assert.equal(
      screen.queryByRole("heading", { name: "Praia do Satu" }),
      null,
    );
  } finally {
    cleanup();
    window.scrollTo = oldScroll;
  }
});

const flightFrom = { name: "Aeroporto do Galeão" };
const flightTo = { name: "Aeroporto de Porto Seguro" };
test("entre Galeão e Porto Seguro, avião é selecionado e não aparece caminhada ou bicicleta por padrão", async () => {
  render(
    React.createElement(JourneyLookup, {
      origin: flightFrom,
      destination: flightTo,
      defaultOpen: true,
    }),
  );
  assert.equal(
    screen.getByRole("button", { name: /Avião/ }).getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    screen.queryByRole("button", { name: "A pé", exact: true }),
    null,
  );
  assert.equal(
    screen.queryByRole("button", { name: "Bicicleta", exact: true }),
    null,
  );
  const link = screen.getByRole("link", { name: "Pesquisar voos no Google" });
  assert.equal(
    new URL(link.href).searchParams.get("q"),
    "voos de GIG para BPS",
  );
  assert.equal(
    screen.queryByRole("link", { name: "Continuar no Google Maps" }),
    null,
  );
  assert.ok(screen.getByText(/O voo é uma parte do caminho/));
});
test("aeroporto do Rio pede o terminal e só libera a pesquisa após escolher Santos Dumont", async () => {
  render(
    React.createElement(JourneyLookup, {
      origin: { name: "aeropoto rio" },
      destination: flightTo,
      defaultOpen: true,
    }),
  );
  assert.ok(screen.getByLabelText("Aeroporto de saída"));
  assert.equal(
    screen.queryByRole("link", { name: "Pesquisar voos no Google" }),
    null,
  );
  const ui = userEvent.setup();
  await ui.selectOptions(
    screen.getByLabelText("Aeroporto de saída"),
    "airport-sdu",
  );
  assert.equal(
    new URL(
      screen.getByRole("link", { name: "Pesquisar voos no Google" }).href,
    ).searchParams.get("q"),
    "voos de SDU para BPS",
  );
  assert.equal(
    screen.getByRole("button", { name: /Avião/ }).getAttribute("aria-pressed"),
    "true",
  );
});
test("dois aeroportos do Rio mantêm acesso terrestre e outras opções são uma escolha explícita", async () => {
  render(
    React.createElement(JourneyLookup, {
      origin: flightFrom,
      destination: { name: "Santos Dumont" },
      defaultOpen: true,
    }),
  );
  assert.ok(screen.getByText("Conexão entre terminais"));
  assert.equal(
    screen.queryByRole("button", { name: "Avião", exact: true }),
    null,
  );
  assert.ok(screen.getByRole("link", { name: "Continuar no Google Maps" }));
  const ui = userEvent.setup();
  await ui.click(screen.getByRole("button", { name: "Outras formas de ir" }));
  await ui.click(screen.getByRole("button", { name: "Avião", exact: true }));
  assert.ok(screen.getByRole("link", { name: "Pesquisar voos no Google" }));
});
test("pontos iguais por apelidos do aeroporto impedem pesquisa e painel inválidos", async () => {
  render(
    React.createElement(RoutesView, {
      origin: { name: "GIG" },
      onChangeOrigin: () => {},
      initialDestination: { name: "Aeroporto do Galeão" },
    }),
  );
  await screen.findByDisplayValue("Aeroporto do Galeão");
  const ui = userEvent.setup();
  await ui.click(screen.getByRole("button", { name: "Ver como ir" }));
  assert.ok(
    screen.getByRole("alert").textContent.includes("destino diferente"),
  );
  assert.equal(screen.queryByRole("dialog"), null);
});
test("trocar os pontos descarta a escolha de avião da pesquisa anterior", () => {
  const view = render(
    React.createElement(JourneyLookup, {
      origin: flightFrom,
      destination: flightTo,
      defaultOpen: true,
    }),
  );
  assert.ok(screen.getByRole("link", { name: "Pesquisar voos no Google" }));
  view.rerender(
    React.createElement(JourneyLookup, {
      origin,
      destination,
      defaultOpen: true,
    }),
  );
  assert.equal(
    screen.queryByRole("link", { name: "Pesquisar voos no Google" }),
    null,
  );
  assert.ok(screen.getByRole("button", { name: "A pé", exact: true }));
  assert.equal(
    new URL(
      screen.getByRole("link", { name: "Continuar no Google Maps" }).href,
    ).searchParams.get("origin"),
    `${origin.lat},${origin.lng}`,
  );
});
test("resposta atrasada do GPS não substitui origem editada manualmente", async () => {
  let success;
  const previous = Object.getOwnPropertyDescriptor(navigator, "geolocation");
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: (cb) => {
        success = cb;
      },
    },
  });
  function Harness() {
    const [from, setFrom] = React.useState({ name: "Centro do Rio" });
    return React.createElement(RoutesView, {
      origin: from,
      onChangeOrigin: setFrom,
    });
  }
  try {
    render(React.createElement(Harness));
    const ui = userEvent.setup();
    await ui.click(
      screen.getByRole("button", { name: "Usar localização", exact: true }),
    );
    await ui.clear(screen.getByLabelText("Origem"));
    await ui.type(screen.getByLabelText("Origem"), "Origem escolhida por mim");
    await React.act(async () =>
      success({ coords: { latitude: -22.1, longitude: -43.1 } }),
    );
    assert.equal(
      screen.getByLabelText("Origem").value,
      "Origem escolhida por mim",
    );
  } finally {
    if (previous) Object.defineProperty(navigator, "geolocation", previous);
    else delete navigator.geolocation;
  }
});

test("escolher aeroporto ambíguo atualiza também a origem do formulário", async () => {
  function Harness() {
    const [from, setFrom] = React.useState({ name: "Aeroporto do Rio" });
    return React.createElement(RoutesView, {
      origin: from,
      onChangeOrigin: setFrom,
      initialDestination: flightTo,
    });
  }
  render(React.createElement(Harness));
  await screen.findByDisplayValue(flightTo.name);
  const ui = userEvent.setup();
  await ui.click(screen.getByRole("button", { name: "Ver como ir" }));
  await ui.selectOptions(
    screen.getByLabelText("Aeroporto de saída"),
    "airport-gig",
  );
  await screen.findByRole("link", { name: "Pesquisar voos no Google" });
  await ui.click(screen.getByRole("button", { name: "Fechar", exact: true }));
  assert.ok(screen.getByLabelText("Origem").value.includes("Galeão"));
});


test("Explorar permite escolher fotos e pausar o destaque", async () => {
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  const tour = { id: "hero-test", title: "Praia de teste", location: "Cidade, Brasil", photos: [{ url: "/first.jpg", caption: "Primeira foto" }, { url: "/second.jpg", caption: "Segunda foto" }] };
  render(React.createElement(ExploreHero, { destinations: tour.photos.map((photo, index) => ({ ...tour, id: tour.id + index, title: tour.title + (index ? " dois" : ""), photos: [photo] })) }));
  assert.ok(screen.getByRole("heading", { name: /Menos pressa/ }));
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Ver destino 2: Praia de teste dois" }));
  assert.equal(screen.getByRole("img").getAttribute("src"), "/second.jpg");
  assert.equal(screen.getByRole("button", { name: "Ver destino 2: Praia de teste dois" }).getAttribute("aria-pressed"), "true");
  await user.click(screen.getByRole("button", { name: "Retomar animações do destaque" }));
  assert.ok(screen.getByRole("button", { name: "Pausar animações do destaque" }));
});

test("Explorar respeita redução de movimento e mantém navegação manual", async () => {
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  const tour = { id: "hero-reduced", title: "Outra praia", location: "Cidade", photos: [{ url: "/a.jpg" }, { url: "/b.jpg" }] };
  render(React.createElement(ExploreHero, { destinations: tour.photos.map((photo, index) => ({ ...tour, id: tour.id + index, title: tour.title + (index ? " dois" : ""), photos: [photo] })) }));
  assert.equal(screen.queryByRole("button", { name: /Pausar animações/ }), null);
  assert.equal(document.querySelector(".type-cursor.is-running"), null);
  await userEvent.setup().click(screen.getByRole("button", { name: "Ver destino 2: Outra praia dois" }));
  assert.equal(screen.getByRole("img").getAttribute("src"), "/b.jpg");
});

test("Explorar alterna fotos sozinho e interrompe ao interagir", async context => {
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  context.after(() => { delete document.hidden; });
  context.mock.timers.enable({ apis: ["setInterval"] });
  const tour = { id: "hero-auto", title: "Praia automática", location: "Cidade", photos: [{ url: "/auto-a.jpg" }, { url: "/auto-b.jpg" }] };
  const { act, fireEvent } = await import("@testing-library/react");
  render(React.createElement(ExploreHero, { destinations: tour.photos.map((photo, index) => ({ ...tour, id: tour.id + index, title: tour.title + (index ? " dois" : ""), photos: [photo] })) }));
  act(() => context.mock.timers.tick(7000));
  assert.equal(screen.getByRole("img").getAttribute("src"), "/auto-b.jpg");
  fireEvent.mouseEnter(document.querySelector(".explore-hero"));
  act(() => context.mock.timers.tick(7000));
  assert.equal(screen.getByRole("img").getAttribute("src"), "/auto-b.jpg");
  fireEvent.mouseLeave(document.querySelector(".explore-hero"));
  act(() => context.mock.timers.tick(7000));
  assert.equal(screen.getByRole("img").getAttribute("src"), "/auto-a.jpg");
  cleanup();
  context.mock.timers.reset();
});

test("destaque mostra cinco destinos reais e abre o destino selecionado", async () => {
  const { BEACHES } = await server.ssrLoadModule("/src/data/beachCatalog.js");
  const ids = ["rj-copacabana", "caraiva-praia", "trancoso-quadrado", "ssa-farol-barra", "jpa-tambau"];
  const destinations = ids.map(id => BEACHES.find(place => place.id === id));
  assert.equal(new Set(destinations.map(place => place.region)).size, 5);
  let opened;
  render(React.createElement(ExploreHero, { destinations, onSelect: place => { opened = place; } }));
  const user = userEvent.setup();
  assert.equal(screen.getByRole("group", { name: "Escolher destino em destaque" }).querySelectorAll("button").length, 5);
  await user.click(screen.getByRole("button", { name: "Ver destino 5: Praia de Tambaú" }));
  assert.ok(screen.getByRole("button", { name: /Explorar Praia de Tambaú, João Pessoa/ }));
  await user.click(screen.getByRole("button", { name: /Explorar Praia de Tambaú, João Pessoa/ }));
  assert.equal(opened.id, "jpa-tambau");
  assert.ok(document.querySelector(".hero-carousel-controls .hero-motion-toggle") || window.matchMedia().matches);
  assert.equal(document.querySelector(".hero-destination-open .hero-motion-toggle"), null);
});


const itinerarySample = {id:"trip-itin",title:"Nordeste",version:1,legs:[{id:"leg-a",mode:"flight",company:"Companhia",comment:"Bagagem na conexão",status:"planned",segments:[{from:"Rio",to:"Salvador",departure:"2026-11-01T22:00",arrival:"2026-11-01T23:50",fromZone:"America/Sao_Paulo",toZone:"America/Bahia"},{from:"Salvador",to:"João Pessoa",departure:"2026-11-02T02:00",arrival:"2026-11-02T03:20",fromZone:"America/Bahia",toZone:"America/Fortaleza"}]}],visits:[{id:"v",placeId:"espelho",title:"Praia do Espelho",location:"Bahia",address:"Praia do Espelho, BA",visited:false,date:"",comment:""}]};
test("bilhete mostra duração e parada correta com chegada no dia seguinte",async()=>{
  const store={plans:[itinerarySample],activeId:itinerarySample.id,loading:false,busy:false,refresh(){},select(){},save:async()=>{}};
  render(React.createElement(ItineraryView,{store,onOpenPlace(){},onRoute(){}}));
  assert.ok(screen.getByText("5h 20min"));
  await userEvent.setup().click(screen.getByText("Ver percurso e conexões"));
  assert.ok(screen.getByText("2h 10min"));
  await userEvent.setup().click(screen.getByRole("button",{name:"Experiências",exact:true}));
  assert.ok(screen.getByText("Quero ir"));
});
test("salvar no Explorar escolhe a viagem sem marcar a visita automaticamente",async()=>{
  let saved,selected,completed;
  const store={plans:[{id:"one",title:"Primeira",legs:[],visits:[],version:1},{id:"two",title:"Segunda",legs:[],visits:[],version:1}],activeId:"one",busy:false,loading:false,save:async plan=>{saved=plan;},select:id=>{selected=id;}};
  render(React.createElement(SavePlaceSheet,{place:{id:"satu",title:"Praia do Satu",location:"Caraíva"},store,onClose(){},onComplete:title=>{completed=title;}}));
  const ui=userEvent.setup();await ui.selectOptions(screen.getByLabelText("Em qual viagem?"),"two");await ui.click(screen.getByRole("button",{name:"Adicionar à viagem"}));
  assert.equal(saved.id,"two");assert.equal(saved.visits[0].visited,false);assert.equal(saved.visits[0].comment,"");assert.equal(selected,"two");assert.equal(completed,"Segunda");
});
test("erro de salvamento preserva o bilhete e os comentários",async()=>{
  let closed=false;
  render(React.createElement(LegEditor,{plan:itinerarySample,leg:itinerarySample.legs[0],busy:false,onSave:async()=>{throw new Error("Sem conexão para salvar");},onClose:()=>{closed=true;}}));
  await userEvent.setup().click(screen.getByRole("button",{name:"Salvar trecho"}));
  assert.ok(await screen.findByText("Sem conexão para salvar"));assert.equal(screen.getByLabelText("Comentário (opcional)").value,"Bagagem na conexão");assert.equal(closed,false);
});
test("registro do lugar permite marcar visita e adicionar comentário",async()=>{
  let saved;
  const store={plans:[itinerarySample],activeId:itinerarySample.id,loading:false,busy:false,refresh(){},select(){},save:async plan=>{saved=plan;}};
  render(React.createElement(ItineraryView,{store,onOpenPlace(){},onRoute(){}}));
  const ui=userEvent.setup();await ui.click(screen.getByRole("button",{name:"Experiências",exact:true}));await ui.click(screen.getByRole("button",{name:"Comentar ou editar Praia do Espelho"}));await ui.selectOptions(screen.getByLabelText("Situação"),"visited");await ui.type(screen.getByLabelText("Seu comentário (opcional)"),"Fui pela manhã.");await ui.click(screen.getByRole("button",{name:"Salvar registro"}));
  assert.equal(saved.visits[0].visited,true);assert.equal(saved.visits[0].comment,"Fui pela manhã.");
});

test("salvar um lugar espera o roteiro e cancelar não cria salvo local",async()=>{
  const {BEACHES}=await server.ssrLoadModule('/src/data/beachCatalog.js');const tour=BEACHES.find(p=>p.id==='satu');let accepted=false,calls=0;
  render(React.createElement(TourDetailView,{tour,home:null,onBack(){},onOpenMapWithTour(){},onSwitchToRoute(){},onSaveTour:async()=>{calls++;return accepted;}}));
  const ui=userEvent.setup();await ui.click(screen.getByRole('button',{name:'Salvar passeio',exact:true}));
  assert.equal(JSON.parse(localStorage.getItem('rotaraiz_tour_details')||'{}').satu,undefined);
  accepted=true;await ui.click(screen.getByRole('button',{name:'Salvar passeio',exact:true}));
  assert.ok(JSON.parse(localStorage.getItem('rotaraiz_tour_details')).satu);assert.equal(calls,2);assert.ok(screen.getByRole('button',{name:'Passeio salvo',exact:true}));
});


test("trocar de conta descarta resposta atrasada do roteiro anterior",async()=>{
  let finishFirst;let calls=0;const api={listItineraries:()=>++calls===1?new Promise(resolve=>{finishFirst=resolve;}):Promise.resolve([{...itinerarySample,id:"b",title:"Roteiro da segunda conta"}])};
  function Harness({id}){const store=useItineraries(id,api);return React.createElement('div',null,store.plans.map(plan=>React.createElement('p',{key:plan.id},plan.title)));}
  const ui=render(React.createElement(Harness,{id:'first-user'}));ui.rerender(React.createElement(Harness,{id:'second-user'}));await screen.findByText('Roteiro da segunda conta');
  const {act}=await import('@testing-library/react');await act(async()=>{finishFirst([{...itinerarySample,title:'Roteiro privado anterior'}]);});
  assert.equal(screen.queryByText('Roteiro privado anterior'),null);assert.ok(screen.getByText('Roteiro da segunda conta'));
});

test("viagem tem ações editar e excluir com confirmação e desfazer",async()=>{
  let removed,restored;const store={plans:[itinerarySample],activeId:itinerarySample.id,loading:false,busy:false,refresh(){},select(){},save:async()=>{},remove:async plan=>{removed=plan;return {...plan,version:2};},restore:async plan=>{restored=plan;}};
  render(React.createElement(ItineraryView,{store,onOpenPlace(){},onRoute(){}}));const ui=userEvent.setup();
  assert.ok(screen.getByRole('button',{name:'Renomear viagem'}));await ui.click(screen.getByRole('button',{name:'Excluir viagem',exact:true}));assert.equal(removed,undefined);
  await ui.click(screen.getByRole('button',{name:'Excluir esta viagem'}));assert.equal(removed.id,itinerarySample.id);
  await ui.click(screen.getByRole('button',{name:'Desfazer exclusão'}));assert.equal(restored.version,2);
});


test("abas separam voos e experiências e restaurante tem criar editar excluir",async()=>{
  let latest;const originalConfirm=window.confirm;window.confirm=()=>true;
  function Harness(){const [plan,setPlan]=React.useState({...itinerarySample,visits:[]});return React.createElement(ItineraryView,{store:{plans:[plan],activeId:plan.id,loading:false,busy:false,refresh(){},select(){},save:async next=>{latest=next;setPlan(next);}},onOpenPlace(){},onRoute(){}});}
  try{
    render(React.createElement(Harness));const ui=userEvent.setup();assert.ok(screen.getByRole('heading',{name:'Seus trechos'}));assert.equal(screen.queryByRole('heading',{name:'Suas experiências'}),null);
    await ui.click(screen.getByRole('button',{name:'Experiências',exact:true}));assert.equal(screen.queryByRole('heading',{name:'Seus trechos'}),null);
    await ui.click(screen.getByRole('button',{name:'Adicionar',exact:true}));await ui.type(screen.getByLabelText('Nome do lugar'),'Restaurante da praça');await ui.selectOptions(screen.getByLabelText('Tipo de experiência'),'Restaurante');await ui.type(screen.getByLabelText('Seu comentário (opcional)'),'Gostei do almoço.');await ui.click(screen.getByRole('button',{name:'Salvar registro'}));
    assert.equal(latest.visits[0].category,'Restaurante');assert.equal(latest.visits[0].visited,true);assert.equal(latest.legs.length,1);
    await ui.click(screen.getByRole('button',{name:'Comentar ou editar Restaurante da praça'}));await ui.clear(screen.getByLabelText('Nome do lugar'));await ui.type(screen.getByLabelText('Nome do lugar'),'Restaurante do centro');await ui.click(screen.getByRole('button',{name:'Salvar registro'}));assert.ok(screen.getByRole('heading',{name:'Restaurante do centro'}));
    await ui.click(screen.getByRole('button',{name:'Comentar ou editar Restaurante do centro'}));await ui.click(screen.getByRole('button',{name:'Excluir experiência'}));assert.equal(latest.visits.length,0);assert.equal(latest.legs.length,1);
    await ui.click(screen.getByRole('button',{name:'Voos e trechos',exact:true}));assert.ok(screen.getByRole('heading',{name:'Seus trechos'}));
  }finally{window.confirm=originalConfirm;}
});
