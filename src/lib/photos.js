import galleries from '../data/photoGalleries.json';
import { BEACH_GUIDES } from '../data/beachGuides';
export function getTourPhotos(tour) {
  const primary = BEACH_GUIDES[tour?.id]?.photo || tour?.photo;
  const list = [...(primary ? [{...primary,caption:tour?.title}] : []), ...(galleries[tour?.id] || []), ...(tour?.photos || [])];
  return list.filter((photo,index) => photo?.url && list.findIndex(item=>item.url===photo.url)===index);
}
export const PHOTO_DESTINATIONS = Object.entries(galleries);
