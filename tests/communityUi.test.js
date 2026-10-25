import { before, after, afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
let server, render, screen, cleanup, React, CommunityView, userEvent, dom;
const user = { id: "user-a", user_metadata: { full_name: "Luana França" } };
let community, published;
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
  ({ render, screen, cleanup } = await import("@testing-library/react"));
  userEvent = (await import("@testing-library/user-event")).default;
  server = await createServer({
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true },
    appType: "custom",
  });
  ({ default: CommunityView } = await server.ssrLoadModule(
    "/src/components/CommunityView.jsx",
  ));
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
