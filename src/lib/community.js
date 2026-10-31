import { supabase } from "./supabase";
import { optimizeGalleryImage } from "./travelerProfiles";
export const COMMUNITY_CATEGORIES = [
  "Alimentação",
  "Praia",
  "Passeio",
  "Hospedagem",
  "Outros",
];
export function instagramUrl(value) {
  const raw = value.trim();
  if (!raw) return "";
  const handle = raw
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(handle))
    throw new Error("Informe o @perfil ou o link do perfil no Instagram.");
  return `https://www.instagram.com/${handle}/`;
}

export function validRecommendation(item) {
  return (
    item &&
    ["name", "category", "city", "address", "note"].every(
      (k) => typeof item[k] === "string" && item[k].trim(),
    ) &&
    typeof item.id === "string" &&
    (COMMUNITY_CATEGORIES.includes(item.category)||item.category==="Comida") &&
    (item.instagram == null || typeof item.instagram === "string")
  );
}
export function safeInstagram(value) {
  try {
    return instagramUrl(String(value || ""));
  } catch {
    return "";
  }
}

export async function getPublicAuthors(ids) {
 if(!supabase||!ids?.length)return {};
 const {data,error}=await supabase.from("rr_profiles").select("user_id,display_name,avatar_url").in("user_id",ids);
 if(error)return {};
 return Object.fromEntries((data||[]).map(x=>[x.user_id,x]));
}

export async function getRecommendations() {
  if (!supabase) return { items: [], available: false };
  const { data, error } = await supabase
    .from("community_recommendations")
    .select(
      "id,name,category,city,address,instagram,note,author_name,user_id,created_at,reviewed_at,image_url,source_url,editorial,photo_credit,photo_source_url,place_id,version",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) return { items: [], available: false };
  return {
    items: (data || []).filter(
      (i) =>
        validRecommendation(i) &&
        i.reviewed_at &&
        Number.isFinite(Date.parse(i.reviewed_at)),
    ),
    available: true,
  };
}
export async function submitRecommendation(item) {
  if (!supabase)
    throw new Error(
      "A comunidade está sem conexão. Sua indicação não foi publicada.",
    );
  if(item.place_id){
    const {data,error}=await supabase.rpc("rr_publish_selected_place",{p_place_id:item.place_id,p:{note:item.note}});
    if(error)throw new Error("Não foi possível publicar sua experiência neste lugar. Os campos foram mantidos.");
    return data;
  }
  const { data, error } = await supabase.rpc("rr_publish_recommendation", {
    p: {
      name: item.name,
      category: item.category==="Alimentação"?"Comida":item.category,
      city: item.city,
      address: item.address,
      instagram: item.instagram,
      note: item.note,
    },
  });
  if (error)
    throw new Error(
      ["PGRST202", "42883"].includes(error.code)
        ? "A publicação da comunidade precisa ser ativada no banco. Sua indicação não foi publicada."
        : "Não foi possível publicar agora. Tente novamente; os campos foram mantidos.",
    );
  return data;
}

export const profileName = (user) => {
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name;
  return typeof name === "string" && name.trim()
    ? name.trim().slice(0, 60)
    : "Viajante";
};

export async function getEngagement() {
  if(!supabase)return {};
  const {data,error}=await supabase.rpc("rr_community_engagement");
  if(error)throw new Error("Não foi possível carregar curtidas e comentários.");
  return Object.fromEntries((data||[]).map(x=>[x.id,{likes:Number(x.likes)||0,comments:Number(x.comments)||0,liked:!!x.liked}]));
}

export async function toggleLike(recommendationId,currentlyLiked) {
  if(!supabase)throw new Error("Sem conexão com a comunidade.");
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)throw new Error("Entre com sua conta para curtir.");
  const query=supabase.from("community_likes");
  const {error}=currentlyLiked?await query.delete().eq("recommendation_id",recommendationId).eq("user_id",user.id):
    await query.insert({recommendation_id:recommendationId,user_id:user.id});
  if(error)throw new Error("Não foi possível atualizar sua curtida.");
  return !currentlyLiked;
}
export async function getComments(recommendationId) {
  const {data,error}=await supabase.from("community_comments")
    .select("id,user_id,author_name,body,created_at")
    .eq("recommendation_id",recommendationId)
    .order("created_at",{ascending:true}).limit(100);
  if(error)throw new Error("Não foi possível abrir os comentários.");
  return data||[];
}
export async function addComment(recommendationId,body) {
  const {data,error}=await supabase.rpc("rr_add_community_comment",{p_recommendation:recommendationId,p_body:body.trim()});
  if(error)throw new Error("Não foi possível publicar seu comentário.");
  return data;
}
export async function editComment(commentId,body) {
  const {data,error}=await supabase.rpc("rr_edit_community_comment",{p_id:commentId,p_body:body.trim()});
  if(error)throw new Error("Não foi possível editar seu comentário.");
  return data;
}
export async function reportComment(commentId) {
  const {error}=await supabase.rpc("rr_report_comment",{p_comment:commentId});
  if(error)throw new Error("Não foi possível enviar a denúncia.");
}
export async function deleteComment(commentId) {
  const {error}=await supabase.from("community_comments").delete().eq("id",commentId);
  if(error)throw new Error("Não foi possível excluir seu comentário.");
}
function oldPhotoPath(url) {
  const marker="/storage/v1/object/public/community-photos/";
  if(typeof url!=="string"||!url.includes(marker))return null;
  return decodeURIComponent(url.split(marker)[1]?.split("?")[0]||"");
}
export async function uploadRecommendationPhoto(user,id,file,previousUrl="") {
  if(!supabase||!user?.id)throw new Error("Entre na conta para enviar uma foto.");
  const blob=await optimizeGalleryImage(file);
  const {data:room,error:roomError}=await supabase.rpc("rr_storage_room",{p_uid:user.id});
  if(roomError)throw new Error("Não foi possível verificar o limite de fotos.");
  if(!room)throw new Error("Limite preventivo de fotos atingido (20 por conta ou 700 MB no total). Procure a administração.");
  const path=user.id+"/"+id+"/"+crypto.randomUUID()+".webp";
  const {error:uploadError}=await supabase.storage.from("community-photos").upload(path,blob,{contentType:"image/webp",upsert:false});
  if(uploadError)throw new Error("Não foi possível enviar a foto. Verifique seu limite de 20 fotos ou tente novamente.");
  const {data}=supabase.storage.from("community-photos").getPublicUrl(path);
  const {error}=await supabase.rpc("rr_set_community_photo",{p_id:id,p_url:data.publicUrl});
  if(error){
    await supabase.storage.from("community-photos").remove([path]);
    throw new Error("Foto enviada, mas não foi possível vinculá-la à indicação.");
  }
  const old=oldPhotoPath(previousUrl);
  if(old && old!==path)await supabase.storage.from("community-photos").remove([old]);
  return data.publicUrl;
}
export async function removeRecommendationPhoto(id,previousUrl) {
  const {error}=await supabase.rpc("rr_set_community_photo",{p_id:id,p_url:null});
  if(error)throw new Error("Não foi possível remover a foto.");
  const path=oldPhotoPath(previousUrl);
  if(path)await supabase.storage.from("community-photos").remove([path]);
}

export async function updateRecommendation(id,item) {
  if(item.place_id){
    const {data,error}=await supabase.rpc("rr_update_selected_place",{p_id:id,p_place_id:item.place_id,p_note:item.note,p_expected_version:item.version});
    if(error)throw new Error("Não foi possível salvar. Confira a conexão e atualize a indicação antes de tentar novamente.");
    return data;
  }
  const {data,error}=await supabase.rpc("rr_update_recommendation",{p_id:id,p:item});
  if(error)throw new Error("Não foi possível editar a indicação. Verifique os dados e tente novamente.");
  return data;
}
export async function deleteRecommendation(id,imageUrl) {
  const {error}=await supabase.rpc("rr_delete_recommendation",{p_id:id});
  if(error)throw new Error("Não foi possível excluir a indicação.");
  const path=oldPhotoPath(imageUrl);
  if(path)await supabase.storage.from("community-photos").remove([path]);
}
