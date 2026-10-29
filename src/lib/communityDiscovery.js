import { groupCommunityRecommendations, normalizePlaceText } from './communityGroups.js';
export function selectCommunityGroups(items, {city='',query='',category='all'}={}) {
  const norm=normalizePlaceText;
  const categoryOf=item=>['Comida','Alimentação'].includes(item.category)?'food':item.category==='Praia'?'beaches':'outings';
  return groupCommunityRecommendations(items.filter(item=>
    (!city || norm(`${item.city} ${item.address}`).includes(norm(city))) &&
    (category==='all'||categoryOf(item)===category) &&
    (!query.trim() || norm(`${item.name} ${item.city} ${item.address} ${item.note}`).includes(norm(query)))
  ));
}
