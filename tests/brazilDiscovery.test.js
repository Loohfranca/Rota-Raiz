import { test } from "node:test";
import assert from "node:assert/strict";
import {
  discoveryMapsUrl,
  DISCOVERY_CATEGORIES,
} from "../src/lib/discoverBrazil.js";
import { TRANCOSO_PLACES } from "../src/data/trancosoPlaces.js";
import { nearestRegion, selectBeaches } from "../src/lib/nearby.js";
test("busca nacional gera apenas links de pesquisa com texto e categoria preservados", () => {
  assert.equal(discoveryMapsUrl(" "), null);
  for (const c of DISCOVERY_CATEGORIES) {
    const u = new URL(discoveryMapsUrl("Bonito, MS", c.id));
    assert.equal(u.host, "www.google.com");
    assert.equal(u.pathname, "/maps/search/");
    assert.equal(
      u.searchParams.get("query"),
      `${c.query} em Bonito, MS, Brasil`,
    );
    assert.equal(u.searchParams.get("api"), "1");
    assert.equal(u.searchParams.has("key"), false);
  }
  const u = new URL(discoveryMapsUrl("São João & Região, RJ", "unknown"));
  assert.equal(
    u.searchParams.get("query"),
    "pontos turísticos em São João & Região, RJ, Brasil",
  );
});
test("Trancoso é uma região própria com catálogo inicial de praia e cultura", () => {
  const home = { name: "Trancoso", lat: -16.5901, lng: -39.0975 };
  assert.equal(nearestRegion(home).id, "trancoso");
  const list = selectBeaches(TRANCOSO_PLACES, { home });
  assert.equal(list.length, 6);
  assert.equal(new Set(list.map((i) => i.id)).size, 6);
  assert.ok(list.some((i) => i.category === "Cultura"));
  assert.ok(list.some((i) => i.title === "Praia dos Nativos"));
  for (const p of list) {
    assert.ok(p.address.includes("Trancoso"));
    assert.ok(p.guide_sources.length);
    assert.ok(p.access_options.length);
  }
});
