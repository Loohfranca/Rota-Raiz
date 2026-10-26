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
  const to = { name: "Aeroporto do Galeão, Rio de Janeiro, RJ" };
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
