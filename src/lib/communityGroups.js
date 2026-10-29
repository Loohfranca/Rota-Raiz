// Um lugar pode ter várias experiências, mas só um card na Comunidade.
// Mesmo nome e cidade, com endereço equivalente. CEP não identifica a entrada
// de um estabelecimento e frequentemente é digitado com erros.
export const normalizePlaceText=(value)=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").replace(/\b(rua|r\.|avenida|av\.|travessa|tv\.)\b/g," ").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
export const normalizePlaceAddress=(value)=>normalizePlaceText(String(value||"").replace(/[,\s]+\d{5}[-\s]?\d{3,4}\s*$/,""));
export const placeGroupKey=(item)=>[normalizePlaceText(item.name),normalizePlaceAddress(item.address),normalizePlaceText(item.city)].join("|");
export function groupCommunityRecommendations(items) {
  const groups=new Map();
  for(const item of items) {
    const key=placeGroupKey(item);
    if(!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(item);
  }
  return [...groups.values()];
}
