import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/rotas.js";

function response() {
  return {
    code: 200,
    headers: {},
    data: null,
    setHeader(k, v) { this.headers[k] = v; return this; },
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; return this; },
  };
}

test("rejects invalid and equal origin/destination without calling external API", async () => {
  const res = response();
  await handler({ method: "POST", body: { origin: "Salvador", destination: "salvador" } }, res);
  assert.equal(res.code, 400);
  assert.equal(res.headers["Cache-Control"], "no-store");
});

test("responds clearly when server API key is not configured", async () => {
  const key = process.env.GOOGLE_MAPS_ROUTES_API_KEY;
  delete process.env.GOOGLE_MAPS_ROUTES_API_KEY;
  try {
    const res = response();
    await handler({ method: "POST", body: { origin: "Salvador, BA", destination: "Praia do Forte, BA" } }, res);
    assert.equal(res.code, 503);
    assert.equal(res.data.code, "PROVIDER_NOT_CONFIGURED");
  } finally {
    if (key) process.env.GOOGLE_MAPS_ROUTES_API_KEY = key;
  }
});

test("preserves transit data and unknown fares without inventing prices", async () => {
  const oldKey = process.env.GOOGLE_MAPS_ROUTES_API_KEY;
  const oldFetch = globalThis.fetch;
  process.env.GOOGLE_MAPS_ROUTES_API_KEY = "test-only";
  globalThis.fetch = async (_url, options) => {
    assert.match(options.headers["X-Goog-FieldMask"], /transitDetails/);
    assert.equal(JSON.parse(options.body).travelMode, "TRANSIT");
    return {
      ok: true,
      json: async () => ({ routes: [{
        duration: "5400s",
        legs: [{ steps: [{
          travelMode: "TRANSIT",
          transitDetails: {
            headsign: "Praia do Forte",
            transitLine: { nameShort: "Teste", agencies: [{ name: "Operadora de teste" }] },
            stopDetails: {
              departureStop: { name: "Origem teste" },
              arrivalStop: { name: "Destino teste" },
            },
            localizedValues: { departureTime: { time: { text: "09:00" } } },
          },
        }] }],
      }] }),
    };
  };
  try {
    const res = response();
    await handler({ method: "POST", body: { origin: "Salvador - BA", destination: "Praia do Forte - BA" } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.data.routes.length, 1);
    assert.equal(res.data.routes[0].fare, null);
    assert.equal(res.data.routes[0].durationMinutes, 90);
    assert.equal(res.data.routes[0].steps[0].departureLocal, "09:00");
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey) process.env.GOOGLE_MAPS_ROUTES_API_KEY = oldKey;
    else delete process.env.GOOGLE_MAPS_ROUTES_API_KEY;
  }
});

test("does not present invalid upstream data as a real route", async () => {
  const oldKey = process.env.GOOGLE_MAPS_ROUTES_API_KEY;
  const oldFetch = globalThis.fetch;
  process.env.GOOGLE_MAPS_ROUTES_API_KEY = "test-only";
  globalThis.fetch = async () => ({ ok: false, status: 403 });
  try {
    const res = response();
    await handler({ method: "POST", body: { origin: "Salvador", destination: "Penedo" } }, res);
    assert.equal(res.code, 502);
    assert.equal(res.data.code, "PROVIDER_ERROR");
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey) process.env.GOOGLE_MAPS_ROUTES_API_KEY = oldKey;
    else delete process.env.GOOGLE_MAPS_ROUTES_API_KEY;
  }
});
