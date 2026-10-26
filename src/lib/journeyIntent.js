import {
  airportCandidates,
  airportText,
  matchAirport,
  TRAVEL_CITIES,
} from "../data/travelNetwork.js";
import { CITIES } from "../data/seedData.js";
import { hasCoordinates } from "./walking.js";
import { haversineDistance, normalizeText } from "./router.js";

export const JOURNEY_MODES = [
  { mode: "flight", label: "Avião" },
  { mode: "transit", label: "Transporte público" },
  { mode: "walking", label: "A pé" },
  { mode: "driving", label: "Carro / táxi" },
  { mode: "bicycling", label: "Bicicleta" },
];
const cities = [...TRAVEL_CITIES, ...CITIES];
function cityFor(point) {
  const airport = matchAirport(point);
  if (airport) return cities.find((c) => c.id === airport.served_city_id);
  const text = airportText(point)
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ");
  if (/^(rio|rj)$/.test(text))
    return TRAVEL_CITIES.find((c) => c.id === "rio-de-janeiro");
  return cities.find((c) => ` ${text} `.includes(` ${normalizeText(c.name)} `));
}
function reference(point) {
  if (hasCoordinates(point)) return point;
  return matchAirport(point) || cityFor(point);
}
export function journeyError(origin, destination) {
  if (!origin?.name?.trim() || !destination?.name?.trim())
    return "Preencha de onde você sai e para onde vai.";
  const a = matchAirport(origin),
    b = matchAirport(destination);
  if (
    normalizeText(origin.name) === normalizeText(destination.name) ||
    (a && b && a.id === b.id)
  )
    return "Escolha um destino diferente da sua origem.";
  if (
    hasCoordinates(origin) &&
    hasCoordinates(destination) &&
    Math.abs(Number(origin.lat) - Number(destination.lat)) < 0.000001 &&
    Math.abs(Number(origin.lng) - Number(destination.lng)) < 0.000001
  )
    return "Escolha um destino diferente da sua origem.";
  return "";
}
export function journeyIntent(origin, destination) {
  const a = matchAirport(origin),
    b = matchAirport(destination);
  const ca = cityFor(origin),
    cb = cityFor(destination);
  const ra = reference(origin),
    rb = reference(destination);
  const km =
    hasCoordinates(ra) && hasCoordinates(rb)
      ? haversineDistance(
          Number(ra.lat),
          Number(ra.lng),
          Number(rb.lat),
          Number(rb.lng),
        )
      : null;
  const airportPair =
    /aeroporto|airport/.test(airportText(origin)) &&
    /aeroporto|airport/.test(airportText(destination));
  const sameCity =
    (a && b && a.served_city_id === b.served_city_id) ||
    (ca && cb && ca.id === cb.id);
  const intercity = !!(
    (a && b && !sameCity) ||
    (km != null && km >= 150) ||
    (airportPair && !sameCity && km == null)
  );
  // Distances only choose useful defaults; they are never presented as route distances.
  const suggested = intercity
    ? ["flight", "transit", "driving"]
    : a && b && sameCity
      ? ["transit", "driving"]
      : [
          "transit",
          ...(km == null || km <= 10 ? ["walking"] : []),
          "driving",
          ...(km == null || km <= 60 ? ["bicycling"] : []),
        ];
  return {
    intercity,
    sameCity,
    km,
    suggested,
    originAirport: a,
    destinationAirport: b,
    originCandidates: airportCandidates(origin),
    destinationCandidates: airportCandidates(destination),
  };
}
export function flightSearchUrl(origin, destination) {
  const label = (p) => matchAirport(p)?.airport_code || p?.name?.trim();
  if (journeyError(origin, destination)) return null;
  return `https://www.google.com/search?${new URLSearchParams({ q: `voos de ${label(origin)} para ${label(destination)}`, hl: "pt-BR" })}`;
}
