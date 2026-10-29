import { supabase } from "./supabase";
export const COMMUNITY_CATEGORIES = [
  "Comida",
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
    COMMUNITY_CATEGORIES.includes(item.category) &&
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

export async function getRecommendations() {
  if (!supabase) return { items: [], available: false };
  const { data, error } = await supabase
    .from("community_recommendations")
    .select(
      "id,name,category,city,address,instagram,note,author_name,user_id,created_at,reviewed_at,image_url,source_url,editorial,photo_credit,photo_source_url",
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
  const { data, error } = await supabase.rpc("rr_publish_recommendation", {
    p: {
      name: item.name,
      category: item.category,
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
  const {data,error}=await supabase.from("community_comments").update({body:body.trim()})
    .eq("id",commentId).select("id,user_id,author_name,body,created_at").single();
  if(error)throw new Error("Não foi possível editar seu comentário.");
  return data;
}
export async function deleteComment(commentId) {
  const {error}=await supabase.from("community_comments").delete().eq("id",commentId);
  if(error)throw new Error("Não foi possível excluir seu comentário.");
}
async function optimizeImage(file) {
  if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("Envie JPG, PNG ou WebP.");
  if(file.size>3*1024*1024)throw new Error("A imagem deve ter até 3 MB.");
  // Limitar resolução no navegador para economizar armazenamento e transferência.
  const img=await createImageBitmap(file);
  try {
    const scale=Math.min(1,1400/Math.max(img.width,img.height));
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(img.width*scale));
    canvas.height=Math.max(1,Math.round(img.height*scale));
    canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",.80));
    if(!blob) throw new Error("Não foi possível preparar a foto.");
    return blob;
  } finally { img.close?.(); }
}
function oldPhotoPath(url) {
  const marker="/storage/v1/object/public/community-photos/";
  if(typeof url!=="string"||!url.includes(marker))return null;
  return decodeURIComponent(url.split(marker)[1]?.split("?")[0]||"");
}
export async function uploadRecommendationPhoto(user,id,file,previousUrl="") {
  if(!supabase||!user?.id)throw new Error("Entre na conta para enviar uma foto.");
  const blob=await optimizeImage(file);
  const path=user.id+"/"+id+"/"+crypto.randomUUID()+".webp";
  const {error:uploadError}=await supabase.storage.from("community-photos").upload(path,blob,{contentType:"image/webp",upsert:false});
  if(uploadError)throw new Error("Erro ao enviar foto. Confira a conexão e tente novamente.");
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
