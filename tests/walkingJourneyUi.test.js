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
