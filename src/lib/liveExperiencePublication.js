import { supabase } from "./supabase";
import { optimizeGalleryImage } from "./travelerProfiles";
import { createExperiencePublication } from "./experiencePublication.js";
const services=new WeakMap();
function current(){
  if(!supabase)throw new Error("Conecte-se para publicar sua experiência.");
  if(!services.has(supabase))services.set(supabase,createExperiencePublication(supabase,{optimize:optimizeGalleryImage}));
  return services.get(supabase);
}
function decorate(row){if(!row)return row;const path=row.photos?.find(p=>p.is_cover)?.storage_path;return {...row,...(path?{image_url:experiencePhotoUrl(path)}:{})};}
export const experiencePublication={get:async(...a)=>decorate(await current().get(...a)),save:async(...a)=>decorate(await current().save(...a)),retry:async(...a)=>decorate(await current().retry(...a)),setDeleted:(...a)=>current().setDeleted(...a)};
export function experiencePhotoUrl(path){return supabase?.storage.from('community-photos').getPublicUrl(path).data.publicUrl||'';}
