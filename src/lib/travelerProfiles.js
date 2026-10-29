import {supabase} from "./supabase";
const bucket="traveler-profiles";
function errorOf(error,fallback){if(error)throw new Error(error.message||fallback);}
export async function ensureProfile(){const {data,error}=await supabase.rpc("rr_ensure_profile");errorOf(error,"Erro ao criar perfil.");return data;}
export async function getProfile(id){const {data,error}=await supabase.from("rr_profiles").select("user_id,display_name,bio,instagram,avatar_url,created_at").eq("user_id",id).maybeSingle();errorOf(error,"Erro ao carregar perfil.");return data;}
export async function saveProfile(id,details){
 const {data,error}=await supabase.from("rr_profiles").update({display_name:details.display_name.trim().slice(0,60),bio:details.bio.trim().slice(0,240),instagram:details.instagram.trim().replace(/^@/,"").slice(0,30)}).eq("user_id",id).select().single();
 errorOf(error,"Erro ao salvar perfil.");return data;
}
export async function getTravelerRecommendations(userId) {
 const {data,error}=await supabase.from("community_recommendations")
   .select("id,name,city,category,note,image_url,created_at")
   .eq("user_id",userId).eq("status","approved")
   .order("created_at",{ascending:false}).limit(100);
 errorOf(error,"Não foi possível carregar as indicações.");
 return data||[];
}
export async function getProfileCities(id){const {data,error}=await supabase.from("rr_profile_cities").select("id,user_id,city,state,place_name,created_at").eq("user_id",id).order("created_at",{ascending:false});errorOf(error,"Erro ao carregar cidades.");return data||[];}
export async function addProfileCity(userId,city,state,placeName){const {data,error}=await supabase.from("rr_profile_cities").insert({user_id:userId,city:city.trim(),state:state.trim(),place_name:(placeName||city).trim()}).select().single();errorOf(error,"Não foi possível cadastrar experiência. Verifique se este lugar já foi cadastrado.");return data;}
export async function deleteProfileCity(id){const {error}=await supabase.from("rr_profile_cities").delete().eq("id",id);errorOf(error,"Não foi possível remover a cidade.");}
export async function getCityPhotos(userId){
 const {data,error}=await supabase.from("rr_profile_photos").select("id,user_id,city_id,storage_path,caption,created_at").eq("user_id",userId).order("created_at",{ascending:false});
 errorOf(error,"Não foi possível carregar fotos.");
 const photos=data||[];
 const ids=photos.map(p=>p.id);
 let likes=[];
 if(ids.length){const res=await supabase.from("rr_profile_photo_likes").select("photo_id,user_id").in("photo_id",ids);errorOf(res.error,"Não foi possível carregar curtidas.");likes=res.data||[];}
 const {data:session}=await supabase.auth.getUser();const mine=session?.user?.id;
 return photos.map(p=>({...p,url:supabase.storage.from(bucket).getPublicUrl(p.storage_path).data.publicUrl,likes:likes.filter(l=>l.photo_id===p.id).length,liked:likes.some(l=>l.photo_id===p.id&&l.user_id===mine)}));
}
export async function togglePhotoLike(photoId,liked,userId){
 if(liked){const {error}=await supabase.from("rr_profile_photo_likes").delete().eq("photo_id",photoId).eq("user_id",userId);errorOf(error,"Erro ao remover curtida.");}
 else{const {error}=await supabase.from("rr_profile_photo_likes").insert({photo_id:photoId,user_id:userId});errorOf(error,"Erro ao curtir.");}
}
export async function optimizeGalleryImage(file){
 // A foto original pode ser grande: a cota de 1 MB é aplicada ao WebP compactado, não à foto da galeria.
 const mime=String(file.type||"").toLowerCase();
 const isImage=mime.startsWith("image/")||/\\.(jpe?g|png|webp|heic|heif|avif)$/i.test(file.name||"");
 if(!isImage)throw new Error("Escolha uma foto da galeria (JPG, PNG, WebP ou HEIC).");
 if(file.size>25*1048576)throw new Error("Esta foto tem mais de 25 MB. Selecione uma imagem menor.");
 let image=null;
 let imageUrl=null;
 try{
  if(typeof createImageBitmap==="function"){
   try{image=await createImageBitmap(file);}catch{/* alguns celulares só decodificam via elemento img */}
  }
  if(!image){
   imageUrl=URL.createObjectURL(file);
   image=await new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error("Não foi possível ler esta foto. Se for HEIC, tente compartilhá-la como JPG pela galeria."));
    img.src=imageUrl;
   });
  }
  const scale=Math.min(1,1200/Math.max(image.width,image.height));
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(image.width*scale));
  canvas.height=Math.max(1,Math.round(image.height*scale));
  const ctx=canvas.getContext("2d");
  if(!ctx)throw new Error("Não foi possível preparar a foto neste dispositivo.");
  ctx.drawImage(image,0,0,canvas.width,canvas.height);
  let quality=.78,blob;
  do{
   blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",quality));
   quality-=.12;
  }while(blob?.size>950000&&quality>.20);
  if(!blob||blob.type!=="image/webp"||blob.size>1048576)throw new Error("Não foi possível compactar esta foto. Escolha outra imagem.");
  return blob;
 }catch(e){
  if(e instanceof Error&&e.message.startsWith("Não foi possível"))throw e;
  throw new Error("Esta foto não pôde ser aberta pelo navegador. Tente uma foto JPG ou PNG da galeria.");
 }finally{image?.close?.();if(imageUrl)URL.revokeObjectURL(imageUrl);}
}
export async function uploadProfilePhoto(userId,cityId,file,caption=""){
 const blob=await optimizeGalleryImage(file);const path=userId+"/"+crypto.randomUUID()+".webp";
 const up=await supabase.storage.from(bucket).upload(path,blob,{contentType:"image/webp"});
 errorOf(up.error,"Não foi possível enviar a foto.");
 const {data,error}=await supabase.from("rr_profile_photos").insert({user_id:userId,city_id:cityId,storage_path:path,caption:caption.slice(0,180)}).select().single();
 if(error){await supabase.storage.from(bucket).remove([path]);errorOf(error,"Limite de 2 fotos por destino ou 25 fotos totais atingido.");}
 return data;
}
export async function deleteProfilePhoto(photo){const {error}=await supabase.from("rr_profile_photos").delete().eq("id",photo.id);errorOf(error,"Erro ao excluir foto.");await supabase.storage.from(bucket).remove([photo.storage_path]);}
export async function uploadAvatar(userId,file,oldUrl){
 const blob=await optimizeGalleryImage(file);const path=userId+"/"+crypto.randomUUID()+".webp";
 const upload=await supabase.storage.from(bucket).upload(path,blob,{contentType:"image/webp"});errorOf(upload.error,"Erro ao enviar avatar.");
 const url=supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
 const {error}=await supabase.from("rr_profiles").update({avatar_url:url}).eq("user_id",userId);if(error){await supabase.storage.from(bucket).remove([path]);errorOf(error,"Erro ao atualizar avatar.");}
 const marker="/storage/v1/object/public/traveler-profiles/";if(oldUrl?.includes(marker)){const old=oldUrl.split(marker)[1];if(old?.startsWith(userId+"/"))await supabase.storage.from(bucket).remove([decodeURIComponent(old.split("?")[0])]);}
 return url;
}
