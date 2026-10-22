// A handoff to Google Maps, not a route calculated or verified by this app.
const locationValue = point => {
  if (typeof point?.lat === 'number' && typeof point?.lng === 'number' &&
      Number.isFinite(point.lat) && Number.isFinite(point.lng) &&
      Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180) {
    return `${point.lat},${point.lng}`;
  }
  return (point?.address || point?.name || '').trim();
};
export function mapsDirectionsUrl(origin, destination, travelMode = 'transit') {
  const from = locationValue(origin), to = locationValue(destination);
  if (!from || !to) return null;
  const mode = ['transit', 'driving', 'walking'].includes(travelMode) ? travelMode : 'transit';
  const query = new URLSearchParams({api: '1', origin: from, destination: to, travelmode: mode});
  return `https://www.google.com/maps/dir/?${query}`;
}
