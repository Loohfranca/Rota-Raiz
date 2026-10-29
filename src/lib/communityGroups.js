// Agrupar apenas coincidências confiáveis. Nome e endereço são obrigatórios.
// Evita juntar estabelecimentos homônimos em bairros ou cidades diferentes.
export const normalizePlaceText=(value)=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").replace(/\b(rua|r\.|avenida|av\.|travessa|tv\.)\b/g," ").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
export const placeGroupKey=(item)=>[normalizePlaceText(item.name),normalizePlaceText(item.address),normalizePlaceText(item.city)].join("|");
export function groupCommunityRecommendations(items) {
  const groups=new Map();
  for(const item of items) {
    const key=placeGroupKey(item);
    if(!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(item);
  }
  return [...groups.values()];
}
