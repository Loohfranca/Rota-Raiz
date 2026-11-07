// Um lugar pode ter várias experiências, mas só um card na Comunidade.
// Mesmo nome e cidade, com endereço equivalente. CEP não identifica a entrada
// de um estabelecimento e frequentemente é digitado com erros.
export const normalizePlaceText=(value)=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").replace(/\b(rua|r\.|avenida|av\.|travessa|tv\.)\b/g," ").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
export const normalizePlaceAddress=(value)=>normalizePlaceText(String(value||"").replace(/[,\s]+\d{5}[-\s]?\d{3,4}\s*$/,""));
export const placeGroupKey=(item)=>item.place_id ? "place:"+item.place_id : "legacy:"+[normalizePlaceText(item.name),normalizePlaceAddress(item.address),normalizePlaceText(item.city)].join("|");
export function groupCommunityRecommendations(items) {
  const groups=new Map();
  const seen=new Set();
  for(const item of items) {
    if(item.deleted_at || (item.status && item.status!=="approved") || (item.id && seen.has(item.id))) continue;
    if(item.id) seen.add(item.id);
    const key=placeGroupKey(item);
    if(!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(item);
  }
  return [...groups.values()].map(group=>group.sort((a,b)=>
    (b.visited_on||b.visit_date||"").localeCompare(a.visited_on||a.visit_date||"") ||
    (b.created_at||"").localeCompare(a.created_at||"") ||
    (a.id||"").localeCompare(b.id||"")));
}

export function communityPlace(item) {
  const place=item.place;
  return {
    name:place?.name || item.name,
    category:place?.category || item.category,
    city:[place?.city,place?.state].filter(Boolean).join(", ") || item.city,
    address:place?.location_reference || place?.address || item.address,
    destination:place?.destination?.name || "",
    instagram:place?.instagram ?? item.instagram,
  };
}
