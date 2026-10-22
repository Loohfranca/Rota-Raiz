// Backend Vercel: pesquisa de transporte público nacional sem expor a chave da API.
// Não persista nem compartilhe respostas da Google Routes API como cache próprio.
const GOOGLE_ENDPOINT = "https://routes.googleapis.com/directions/v2:computeRoutes";
const FIELD_MASK = [
  "routes.duration",
  "routes.travelAdvisory.transitFare",
  "routes.legs.steps.travelMode",
  "routes.legs.steps.staticDuration",
  "routes.legs.steps.navigationInstruction.instructions",
  "routes.legs.steps.transitDetails",
].join(",");

const normalizedAddress = (value) =>
  typeof value === "string" && value.trim().length >= 3 && value.trim().length <= 160
    && !/[\u0000-\u001f]/.test(value)
    ? value.trim()
    : null;

const asMinutes = (duration) => {
  const seconds = Number(String(duration || "").replace(/s$/, ""));
  return Number.isFinite(seconds) ? Math.max(0, Math.round(seconds / 60)) : null;
};

const parseFare = (fare) => {
  if (!fare || !fare.currencyCode) return null;
  const amount = Number(fare.units || 0) + Number(fare.nanos || 0) / 1e9;
  if (!Number.isFinite(amount)) return null;
  return { amount, currency: fare.currencyCode };
};

const parseStep = (step) => {
  const transit = step.transitDetails;
  const line = transit?.transitLine;
  if (transit) {
    return {
      mode: "transit",
      vehicle: line?.vehicle?.name?.text || line?.vehicle?.type || "Transporte público",
      line: line?.nameShort || line?.name || null,
      agency: line?.agencies?.[0]?.name || null,
      headsign: transit.headsign || null,
      from: transit.stopDetails?.departureStop?.name || null,
      to: transit.stopDetails?.arrivalStop?.name || null,
      departure: transit.stopDetails?.departureTime || null,
      arrival: transit.stopDetails?.arrivalTime || null,
      departureLocal: transit.localizedValues?.departureTime?.time?.text || null,
      arrivalLocal: transit.localizedValues?.arrivalTime?.time?.text || null,
      durationMinutes: asMinutes(step.staticDuration),
    };
  }
  return {
    mode: "walk",
    instruction: step.navigationInstruction?.instructions || "Trecho a pé",
    durationMinutes: asMinutes(step.staticDuration),
  };
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use o método POST." });
  }

  const origin = normalizedAddress(req.body?.origin);
  const destination = normalizedAddress(req.body?.destination);
  if (!origin || !destination || origin.toLocaleLowerCase("pt-BR") === destination.toLocaleLowerCase("pt-BR")) {
    return res.status(400).json({ error: "Informe origem e destino diferentes, com cidade e estado." });
  }

  const key = process.env.GOOGLE_MAPS_ROUTES_API_KEY;
  if (!key) {
    return res.status(503).json({
      error: "A busca nacional ainda precisa ser ativada pelo administrador.",
      code: "PROVIDER_NOT_CONFIGURED",
    });
  }

  try {
    const upstream = await fetch(GOOGLE_ENDPOINT, {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        origin: { address: origin },
        destination: { address: destination },
        travelMode: "TRANSIT",
        computeAlternativeRoutes: true,
        languageCode: "pt-BR",
        regionCode: "BR",
      }),
    });

    if (!upstream.ok) {
      // Não repassar detalhes internos, chave ou conteúdo do provedor ao navegador.
      return res.status(502).json({
        error: "Não foi possível consultar os transportes agora. Tente novamente mais tarde.",
        code: "PROVIDER_ERROR",
      });
    }

    const data = await upstream.json();
    const routes = (data.routes || []).slice(0, 4).map((route) => ({
      durationMinutes: asMinutes(route.duration),
      fare: parseFare(route.travelAdvisory?.transitFare),
      steps: (route.legs || []).flatMap((leg) => (leg.steps || []).map(parseStep)),
    })).filter((route) => route.steps.some((step) => step.mode === "transit"));

    return res.status(200).json({
      origin,
      destination,
      routes,
      source: "Google Maps",
      retrievedAt: new Date().toISOString(),
      disclaimer: "Horários e tarifas são informados pelo provedor, não garantidos em tempo real.",
    });
  } catch {
    return res.status(504).json({ error: "A consulta demorou demais. Tente novamente." });
  }
}