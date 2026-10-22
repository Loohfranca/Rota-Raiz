export const hasCoordinates = point => point && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng)) && Math.abs(Number(point.lat)) <= 90 && Math.abs(Number(point.lng)) <= 180;
export const walkingKey = (from, to) => `rotaraiz_walk_${Number(from.lat).toFixed(6)},${Number(from.lng).toFixed(6)}_${Number(to.lat).toFixed(6)},${Number(to.lng).toFixed(6)}`;
export function decodeShape(encoded) {
  const points = []; let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    const read = () => { let value = 0, shift = 0, byte; do { byte = encoded.charCodeAt(index++) - 63; value |= (byte & 31) << shift; shift += 5; } while (byte >= 32 && index < encoded.length); return value & 1 ? ~(value >> 1) : value >> 1; };
    lat += read(); lng += read(); points.push([lat / 1e6, lng / 1e6]);
  }
  return points;
}
export function cachedWalk(from, to) {
  if (!hasCoordinates(from) || !hasCoordinates(to)) return null;
  try { return JSON.parse(localStorage.getItem(walkingKey(from, to))); } catch { return null; }
}
export async function fetchWalk(from, to, signal) {
  if (!hasCoordinates(from) || !hasCoordinates(to)) throw new Error('Escolha a origem e o destino na lista.');
  const response = await fetch('https://valhalla1.openstreetmap.de/route', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
    body: JSON.stringify({ locations: [{ lat: Number(from.lat), lon: Number(from.lng) }, { lat: Number(to.lat), lon: Number(to.lng) }], costing: 'pedestrian', units: 'kilometers', language: 'pt-BR' })
  });
  if (!response.ok) throw new Error('Não foi possível calcular a caminhada agora. Tente novamente com internet.');
  const data = await response.json();
  if (data.trip?.status !== 0 || !data.trip?.legs?.length) throw new Error('Não encontramos um percurso a pé para esses pontos.');
  const result = { from, to, km: data.trip.summary.length, seconds: data.trip.summary.time, points: data.trip.legs.flatMap(leg => decodeShape(leg.shape)), instructions: data.trip.legs.flatMap(leg => leg.maneuvers.map(m => ({ text: m.instruction, km: m.length }))), calculatedAt: new Date().toISOString() };
  return result;
}
export function saveWalk(result) { localStorage.setItem(walkingKey(result.from, result.to), JSON.stringify(result)); }
