import {hasFiniteCoordinates} from './coordinates.js';
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

// Explicit lookup of a reviewed point, never background tracking or internal-place search.
export async function reversePlacePoint(point, signal) {
 if(!hasFiniteCoordinates(point))throw new Error('Coordenadas inválidas.');
 const endpoint=import.meta.env?.VITE_PLACE_REVERSE_URL||'https://photon.komoot.io/reverse';
 const url=new URL(endpoint);if(url.protocol!=='https:')throw new Error('O provedor de endereço precisa usar HTTPS.');
 for(const [k,v] of Object.entries({lat:point.lat,lon:point.lng,limit:1,radius:0.2}))url.searchParams.set(k,String(v));
 const key=url.toString();signal?.throwIfAborted();if(cache.has(key))return cache.get(key);
 const task=requestQueue.then(async()=>{
  const wait=Math.max(0,1100-(Date.now()-lastRequest));if(wait)await new Promise(r=>setTimeout(r,wait));
  signal?.throwIfAborted();lastRequest=Date.now();
  const response=await fetch(url,{signal:AbortSignal.any([...(signal?[signal]:[]),AbortSignal.timeout(12000)]),headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('Não foi possível sugerir o endereço. Preencha os campos manualmente.');
  const data=await response.json();if(!data.features?.length)throw new Error('Sem endereço para este ponto. Informe município, UF e referência manualmente.');
  if(cache.size>=100)cache.delete(cache.keys().next().value);cache.set(key,data);return data;
 });requestQueue=task.catch(()=>{});return task;
}
