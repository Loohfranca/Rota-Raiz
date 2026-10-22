// Busca de lugares do Brasil inteiro (OpenStreetMap / Nominatim, gratuito e sem chave).
// Política de uso: no máximo 1 requisição por segundo (o componente usa debounce).
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

  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Falha na busca de lugares');
  const data = await res.json();

  const results = data.map((item) => ({
    id: `osm-${item.place_id}`,
    name: item.name || (item.display_name || '').split(',')[0],
    subtitle: buildSubtitle(item.address) || 'Mapa (OpenStreetMap)',
    lat: Number(item.lat),
    lng: Number(item.lon),
    source: 'osm',
  }));

  cache.set(q, results);
  return results;
}
