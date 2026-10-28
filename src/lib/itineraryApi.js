import { supabase } from './supabase';
import { validateItinerary } from './itinerary';
const fields='id,title,legs,visits,version';
function client() { if(!supabase) throw new Error('A conexão da sua conta está indisponível.'); return supabase; }
function fail(error) { if(error) throw new Error(['42P01','PGRST205'].includes(error.code) ? 'O roteiro precisa ser ativado. Tente novamente em instantes.' : 'Não foi possível salvar ou carregar seu roteiro. Confira a conexão e tente novamente.'); }
export async function listItineraries() { const {data,error}=await client().from('travel_itineraries').select(fields).is('deleted_at',null).order('created_at',{ascending:false}); fail(error); return (data||[]).map(validateItinerary); }
export async function createItinerary(title) { const plan=validateItinerary({id:crypto.randomUUID(),title:title.trim(),legs:[],visits:[]}); const {data,error}=await client().from('travel_itineraries').insert(plan).select(fields).single();fail(error);return validateItinerary(data); }
export async function saveItinerary(plan) { validateItinerary(plan); const {data,error}=await client().from('travel_itineraries').update({title:plan.title,legs:plan.legs,visits:plan.visits}).eq('id',plan.id).eq('version',plan.version).select(fields).maybeSingle();fail(error);if(!data)throw new Error('Este roteiro mudou em outra janela. Atualize a lista e reabra o formulário antes de salvar.');return validateItinerary(data); }

export async function deleteItinerary(plan) { const {data,error}=await client().from('travel_itineraries').update({deleted_at:new Date().toISOString()}).eq('id',plan.id).eq('version',plan.version).is('deleted_at',null).select(fields).maybeSingle();fail(error);if(!data)throw new Error('Esta viagem mudou em outra janela. Atualize antes de excluir.');return validateItinerary(data); }
export async function restoreItinerary(plan) { const {data,error}=await client().from('travel_itineraries').update({deleted_at:null}).eq('id',plan.id).eq('version',plan.version).select(fields).maybeSingle();fail(error);if(!data)throw new Error('Não foi possível desfazer. Atualize a lista.');return validateItinerary(data); }
