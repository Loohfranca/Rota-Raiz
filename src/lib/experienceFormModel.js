import {hasFiniteCoordinates} from './coordinates.js';
export const EXPERIENCE_CATEGORIES = ["Comida", "Praia", "Passeio", "Hospedagem", "Outros"];
export const STATES = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
export const categoryOf = value => ({ Praias: "Praia", Alimentação: "Comida", Passeios: "Passeio" }[value] || value || "");
export function experienceCoordinates(item) {
  const source=item.place||item;
  if(hasFiniteCoordinates(source))
    return {lat:Number(source.lat),lng:Number(source.lng)};
  const point=(item.address||'').match(/^Ponto confirmado:\s*(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)\s*,\s*(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)$/i);
  return point&&Math.abs(Number(point[1]))<=90&&Math.abs(Number(point[2]))<=180?{lat:Number(point[1]),lng:Number(point[2])}:null;
}
export function localToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function normalizeInstagram(value = "") {
  const handle = value.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/$/, "");
  if (!handle) return "";
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(handle)) throw new Error("Informe um perfil válido do Instagram, como @nomedolugar.");
  return `https://www.instagram.com/${handle}/`;
}
export function placeDraft(place = {}) {
  return { name: place.name || place.title || "", category: categoryOf(place.category), address: place.address || "",
    municipality: place.municipality || place.city || "", state: place.state || "", instagram: place.instagram || "",
    lat: place.lat == null ? "" : String(place.lat), lng: place.lng == null ? "" : String(place.lng),
    location_reference: place.location_reference || "", location_confirmed: false,
    destination_id: place.destination_id || "", destination_name: place.destination?.name || "" };
}
export function validateExperienceDraft(draft, today = localToday()) {
  const legacy = draft.legacy === true;
  const note = (draft.note || "").trim();
  if (!note || note.length > 500) throw new Error("Conte sua experiência em até 500 caracteres.");
  const how = draft.howToGet || {};
  for (const [key, max] of [["starting_point",160],["transport",120],["route",600]])
    if ((how[key] || "").length > max) throw new Error("Encurte as orientações de Como chegar.");
  if ((draft.tips || "").length > 500) throw new Error("As dicas podem ter até 500 caracteres.");
  const base = { note, how_to_get: how, tips: (draft.tips || "").trim() };
  if (legacy) return base;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.visitedOn || "") || Number.isNaN(Date.parse(`${draft.visitedOn}T12:00:00Z`)) ||
      new Date(`${draft.visitedOn}T12:00:00Z`).toISOString().slice(0,10) !== draft.visitedOn)
    throw new Error("Informe uma data de visita válida.");
  if (draft.visitedOn > today) throw new Error("A data da visita não pode ser futura.");
  const p = { ...draft.placeData };
  if (!(p.name || "").trim() || p.name.trim().length < 2 || p.name.length > 120 || !EXPERIENCE_CATEGORIES.includes(p.category) ||
      !p.legacy_source_id&&(!(p.municipality || "").trim() || p.municipality.trim().length < 2 || !STATES.includes(p.state)))
    throw new Error("Complete nome, categoria, cidade e estado do lugar.");
  p.instagram = normalizeInstagram(p.instagram);
  if (!(p.address || "").trim()) {
    if (String(p.lat).trim() === "" || String(p.lng).trim() === "" || !Number.isFinite(Number(p.lat)) || !Number.isFinite(Number(p.lng)) ||
        Math.abs(Number(p.lat)) > 90 || Math.abs(Number(p.lng)) > 180 || !(p.location_reference || "").trim())
      throw new Error("Informe latitude, longitude e uma referência do lugar.");
    p.lat = Number(p.lat); p.lng = Number(p.lng); delete p.address;
  } else {
    p.address = p.address.trim();
    if (p.address.length > 300) throw new Error("O endereço pode ter até 300 caracteres.");
    if (p.lat === "") delete p.lat; if (p.lng === "") delete p.lng;
  }
  if ((p.location_reference || '').length > 300) throw new Error("A referência pode ter até 300 caracteres.");
  if (p.lat != null || p.lng != null) {
    if (p.lat == null || p.lng == null || String(p.lat).trim()==='' || String(p.lng).trim()==='' || !Number.isFinite(Number(p.lat)) || !Number.isFinite(Number(p.lng)) || Math.abs(Number(p.lat))>90 || Math.abs(Number(p.lng))>180)
      throw new Error("Complete as duas coordenadas válidas do lugar.");
  }
  if (draft.photos?.length !== 2 || draft.photos.some(photo => !photo?.file && !photo?.storage_path)) throw new Error("Escolha as duas fotografias da experiência.");
  if (![0,1].includes(draft.coverIndex)) throw new Error("Escolha uma das fotos como capa.");
  if (draft.photos[0].file && draft.photos[0].file === draft.photos[1].file ||
      draft.photos[0].storage_path && draft.photos[0].storage_path === draft.photos[1].storage_path)
    throw new Error("Escolha duas fotografias diferentes.");
  return { ...base, place_id: draft.placeId || null, place_version: draft.placeVersion ?? null, place: p,
    visited_on: draft.visitedOn, cover_index: draft.coverIndex };
}
