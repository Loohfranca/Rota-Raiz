import { test } from "node:test";
import assert from "node:assert/strict";
import { createInternalPlaceSearch, cityAndState } from "../src/lib/internalPlaceSearchRepository.js";
test("consulta desde uma letra com limite, escopo e cancelamento; não busca catálogo inteiro",async()=>{
 const calls=[];const signal=new AbortController().signal;
 const api=createInternalPlaceSearch({rpc:(name,args)=>{calls.push([name,args]);return {abortSignal:s=>{assert.equal(s,signal);return Promise.resolve({data:[{id:'a'}]});}};}});
 assert.deepEqual(await api.search('A',{destinationId:'boipeba',signal}),[{id:'a'}]);
 assert.deepEqual(calls,[['rr_search_places',{p_query:'A',p_limit:8,p_destination_id:'boipeba'}]]);
 assert.deepEqual(await api.search(''),[]);assert.equal(calls.length,1);
});
test("consulta completa e comparação de duplicatas são chamadas por ID/dados explícitos",async()=>{
 const calls=[];const api=createInternalPlaceSearch({rpc:async(name,args)=>{calls.push([name,args]);return {data:{id:'morere'}};}});
 assert.equal((await api.getPlace('morere')).id,'morere');await api.duplicates({name:'Açúcar',city:'Cairu',state:'BA',address:'Rua Um'});
 assert.deepEqual(calls[0],['rr_get_internal_place',{p_id:'morere'}]);
 assert.equal(calls[1][1].p_municipality,'Cairu');assert.equal(calls[1][1].p_state,'BA');
});
test("falhas de ativação/rede e lugar removido são explícitas; nenhum fallback externo",async()=>{
 await assert.rejects(createInternalPlaceSearch(null).search('A'),/Conecte-se/);
 await assert.rejects(createInternalPlaceSearch({rpc:async()=>({error:{code:'PGRST202'}})}).search('A'),/ativada/);
 await assert.rejects(createInternalPlaceSearch({rpc:async()=>({data:null})}).getPlace('gone'),/não está mais disponível/);
 assert.deepEqual(cityAndState('João Pessoa, PB'),{city:'João Pessoa',state:'PB'});
 assert.deepEqual(cityAndState('Cairu','Bahia'),{city:'Cairu',state:'Bahia'});
 assert.deepEqual(cityAndState('Nome da'),{city:'Nome da',state:''});
});
