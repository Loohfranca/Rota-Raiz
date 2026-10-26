import { haversineDistance, normalizeText } from './router.js';
import { hasCoordinates } from './walking.js';
export const REGIONS = [
  {id:'salvador',name:'Salvador',lat:-12.974,lng:-38.513},
  {id:'joao-pessoa',name:'João Pessoa',lat:-7.1195,lng:-34.845},
  { id: 'trancoso', name: 'Trancoso', lat: -16.5901, lng: -39.0975 },
  { id: 'caraiva', name: 'Caraíva', lat: -16.8102, lng: -39.1454 },
  { id: 'arraial-dajuda', name: "Arraial d’Ajuda", lat: -16.492, lng: -39.073 },
  { id: 'porto-seguro', name: 'Porto Seguro', lat: -16.436, lng: -39.064 },
];
export function distanceFrom(home, place) { return hasCoordinates(home) && hasCoordinates(place) ? haversineDistance(Number(home.lat), Number(home.lng), Number(place.lat), Number(place.lng)) : null; }
export function nearestRegion(home) {
  if (!hasCoordinates(home)) return null;
  const sorted = REGIONS.map(region => ({ ...region, distance: distanceFrom(home, region) })).sort((a,b) => a.distance-b.distance);
  return sorted[0].distance <= 60 ? sorted[0] : null;
}
export function selectBeaches(places, {home, region = 'auto', query = '', savedIds = null}) {
  const selectedRegion = region === 'auto' ? nearestRegion(home)?.id : region;
  return places.filter(place => {
    if (savedIds && !savedIds.includes(place.id)) return false;
    if (!savedIds && selectedRegion && region !== 'all' && place.region !== selectedRegion) return false;
    const q = normalizeText(query);
    return !q || normalizeText(`${place.title} ${place.location} ${place.region || ''} ${place.subtitle || ''} ${(place.aliases || []).join(' ')}`).includes(q);
  }).map(place => ({ ...place, distanceKm: distanceFrom(home, place) })).sort((a,b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || a.title.localeCompare(b.title));
}
