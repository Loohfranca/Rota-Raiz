import { test } from "node:test";
import assert from "node:assert/strict";
import {
  matchAirport,
  airportCandidates,
} from "../src/data/travelNetwork.js";
import {
  journeyIntent,
  journeyError,
  flightSearchUrl,
} from "../src/lib/journeyIntent.js";
const p = (name) => ({ name });
test("reconhece códigos, nomes e preposições dos aeroportos sem confundir ruas", () => {
  for (const [name, code] of [
    ["GIG", "GIG"],
    ["Aeroporto de Porto Seguro", "BPS"],
    ["Aeroporto de João Pessoa", "JPA"],
    ["Aeroporto de Salvador", "SSA"],
    ["Santos Dumont", "SDU"],
  ])
    assert.equal(matchAirport(p(name))?.airport_code, code);
  assert.equal(matchAirport(p("Rua Santos Dumont")), null);
  assert.equal(matchAirport(p("Hotel Galeão")), null);
  assert.equal(airportCandidates(p("aeropoto rio")).length, 2);
  assert.equal(matchAirport(p("aeroporto rio")), null);
  assert.equal(
    matchAirport({ ...p("Terminal selecionado"), id: "airport-bps" })
      .airport_code,
    "BPS",
  );
});
test("voo é uma opção própria, sem enviar flying como modo inválido ao Maps", () => {
  const from = p("Galeão"),
    to = p("Aeroporto de Porto Seguro");
  const plan = journeyIntent(from, to);
  assert.equal(plan.intercity, true);
  assert.equal(plan.suggested[0], "flight");
  assert.ok(!plan.suggested.includes("walking"));
  assert.ok(!plan.suggested.includes("bicycling"));
  const u = new URL(flightSearchUrl(from, to));
  assert.equal(u.host, "www.google.com");
  assert.equal(u.searchParams.get("q"), "voos de GIG para BPS");
  assert.equal(u.searchParams.has("travelmode"), false);
});
test("acesso local ao aeroporto é diferente de voo entre cidades", () => {
  const local = journeyIntent(
    { name: "Centro, Rio de Janeiro", lat: -22.9106, lng: -43.176 },
    p("SDU"),
  );
  assert.equal(local.intercity, false);
  assert.ok(local.suggested.includes("walking"));
  const transfer = journeyIntent(p("GIG"), p("SDU"));
  assert.equal(transfer.intercity, false);
  assert.ok(!transfer.suggested.includes("flight"));
  const city = journeyIntent(p("Rio de Janeiro, RJ"), p("Porto Seguro, BA"));
  assert.equal(city.intercity, true);
  assert.equal(city.suggested[0], "flight");
});
test("pontos vazios ou iguais são rejeitados, incluindo apelidos e coordenadas iguais", () => {
  assert.ok(journeyError(null, p("BPS")));
  assert.ok(journeyError(p("GIG"), p("Galeão")));
  assert.ok(journeyError(p("São Paulo"), p("sao paulo")));
  assert.ok(
    journeyError({ name: "A", lat: 0, lng: 0 }, { name: "B", lat: 0, lng: 0 }),
  );
  assert.equal(journeyError(p("Rio"), p("Salvador")), "");
  assert.equal(flightSearchUrl(p("GIG"), p("Galeão")), null);
});
