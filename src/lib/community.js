import { supabase } from './supabase';
export const COMMUNITY_CATEGORIES = ['Comida', 'Praia', 'Passeio', 'Hospedagem', 'Outros'];
export function instagramUrl(value) {
  const raw = value.trim(); if (!raw) return '';
  const handle = raw.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/$/, '');
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(handle)) throw new Error('Informe o @perfil ou o link do perfil no Instagram.');
  return `https://www.instagram.com/${handle}/`;
}
export async function getRecommendations() {
  if (!supabase) return { items: [], available: false };
  const { data, error } = await supabase.from('community_recommendations').select('id,name,category,city,address,instagram,note,reviewed_at').eq('status','approved').order('reviewed_at',{ascending:false});
  if (error) return { items: [], available: false };
  return { items: data || [], available: true };
}
export async function submitRecommendation(item) {
  if (!supabase) throw new Error('A publicação compartilhada ainda não está conectada. Sua indicação continua salva neste aparelho.');
  const { error } = await supabase.from('community_recommendations').insert({ id:item.id, name:item.name, category:item.category, city:item.city, address:item.address, instagram:item.instagram, note:item.note, status:'pending' });
  if (error) throw new Error('Não foi possível enviar para revisão. Sua indicação continua salva neste aparelho.');
}
