export const DISCOVERY_CATEGORIES = [
  { id: "attractions", label: "Pontos turísticos", query: "pontos turísticos" },
  { id: "beaches", label: "Praias", query: "praias" },
  { id: "parks", label: "Parques", query: "parques" },
  { id: "waterfalls", label: "Cachoeiras", query: "cachoeiras" },
  { id: "museums", label: "Museus", query: "museus" },
];
export function discoveryMapsUrl(city, category = "attractions") {
  const destination = String(city || "").trim();
  if (destination.length < 2) return null;
  const kind =
    DISCOVERY_CATEGORIES.find((i) => i.id === category) ||
    DISCOVERY_CATEGORIES[0];
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: `${kind.query} em ${destination}, Brasil` })}`;
}
