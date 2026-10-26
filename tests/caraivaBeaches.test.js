import { test } from "node:test";
import assert from "node:assert/strict";
import { CARAIVA_BEACHES } from "../src/data/caraivaBeaches.js";
import { selectBeaches, distanceFrom } from "../src/lib/nearby.js";
import { hasCoordinates } from "../src/lib/walking.js";
import { mapsDirectionsUrl } from "../src/lib/mapsDirections.js";
const home = { name: "Vila de Caraíva", lat: -16.8102, lng: -39.1454 };
test("novos destinos aparecem na região e na busca de Caraíva, com Xandó sem duplicação", () => {
  const all = selectBeaches(CARAIVA_BEACHES, { home, region: "caraiva" });
  assert.equal(all.length, 6);
  assert.equal(new Set(all.map((i) => i.id)).size, 6);
  assert.equal(
    selectBeaches(all, { home, region: "all", query: "Caraíva" }).length,
    6,
  );
  const xando = selectBeaches(all, { home, query: "Xando" });
  assert.equal(xando.length, 2); // Praia de Xandó e Prainha do rio na aldeia.
  const pedra = selectBeaches(all, { home, query: "Pedra do Nego" });
  assert.equal(pedra.length, 1);
  assert.match(pedra[0].title, /Xandó/);
});
test("local sem pino confirmado não inventa km e continua localizável pelo nome", () => {
  for (const place of CARAIVA_BEACHES) {
    assert.ok(place.guide_sources.length);
    assert.ok(place.access_options.length);
    assert.ok(place.tide_note);
    if (!hasCoordinates(place)) assert.equal(distanceFrom(home, place), null);
    const url = new URL(
      mapsDirectionsUrl(home, { ...place, name: place.title }, "walking"),
    );
    assert.equal(url.searchParams.get("destination"), place.address);
    assert.equal(url.searchParams.get("travelmode"), "walking");
  }
});
test("Corumbau fica identificado em Prado com canoa e Prainha é praia de rio fora da foz", () => {
  const ponta = CARAIVA_BEACHES.find((i) => i.id === "corumbau");
  assert.match(ponta.location, /Prado/);
  assert.match(
    ponta.access_options.find((i) => i.id === "road").steps.join(" "),
    /Rio Corumbau.*canoa/,
  );
  assert.ok(ponta.lat > -16.91 && ponta.lat < -16.88);
  const rio = CARAIVA_BEACHES.find((i) => i.id === "caraiva-prainha");
  assert.equal(rio.category, "Praia de rio");
  assert.match(rio.description, /rio acima/);
  assert.ok(rio.lat < -16.82);
});
