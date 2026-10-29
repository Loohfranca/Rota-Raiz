import { supabase } from "./supabase";
async function rpc(fn,args={}) {
  if(!supabase) throw new Error("Supabase indisponível.");
  const {data,error}=await supabase.rpc(fn,args);
  if(error) throw new Error(error.code==="42501"?"Esta conta não tem acesso administrativo.":error.message||"Falha ao carregar informações.");
  return data;
}
export const checkAdmin=()=>rpc("rr_is_admin");
export const pingActivity=()=>rpc("rr_activity_ping");
export const getDashboard=()=>rpc("rr_admin_dashboard");
export const getOverview=section=>rpc("rr_admin_overview",{p_section:section});
export const reviewEvent=(id,decision)=>rpc("rr_admin_review",{p_event:id,p_decision:decision});
export const limits={maxImageInputMB:3,maxImagesPerPerson:20,bucketTargetMB:700};
export const formatSize=bytes=>{const n=Number(bytes)||0;return n>=1048576?(n/1048576).toFixed(2)+" MB":(n/1024).toFixed(0)+" KB";};
