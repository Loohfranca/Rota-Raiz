// Busca de lugares do Brasil inteiro (OpenStreetMap / Nominatim, gratuito e sem chave).
// A aba Passeios usa busca explícita; consultas são espaçadas e resultados ficam em memória.
let requestQueue = Promise.resolve();
let lastRequest = 0;
const cache = new Map();

const buildSubtitle = (address = {}) => {
  const city =
    address.city || address.town || address.village || address.municipality || address.suburb || '';
  return [city, address.state].filter(Boolean).join(' — ');
};

export async function searchPlacesOnline(query, signal) {
  const q = (query || '').trim();
  if (q.length < 3) return [];
  if (cache.has(q)) return cache.get(q);

  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=br' +
    '&accept-language=pt-BR&addressdetails=1&q=' +
    encodeURIComponent(q);

  const request = requestQueue.then(async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastRequest));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    signal?.throwIfAborted();
    lastRequest = Date.now();
    return fetch(url, { signal, headers: { Accept: 'application/json' } });
  });
  requestQueue = request.catch(() => {});
  const res = await request;
  if (!res.ok) throw new Error('Falha na busca de lugares');
  const data = await res.json();

  const results = data.map((item) => ({
    id: `osm-${item.place_id}`,
    name: item.name || (item.display_name || '').split(',')[0],
    subtitle: item.display_name || buildSubtitle(item.address) || 'Mapa (OpenStreetMap)',
    address: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
    source: 'osm',
  }));

  cache.set(q, results);
  return results;
}
