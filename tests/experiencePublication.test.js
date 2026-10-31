import {test} from 'node:test';import assert from 'node:assert/strict';
import {createExperiencePublication} from '../src/lib/experiencePublication.js';
import {validateExperienceDraft,normalizeInstagram,localToday,experienceCoordinates} from '../src/lib/experienceFormModel.js';
const draft=()=>({id:'experience-id',placeData:{name:'Lugar de teste',category:'Praia',address:'Rua Um, 1',municipality:'Cairu',state:'BA',instagram:'',location_confirmed:true},needsConfirmation:true,visitedOn:'2026-10-01',note:'Minha experiência.',photos:[{file:{name:'one'}},{file:{name:'two'}}],coverIndex:0,howToGet:{},tips:''});
function setup({publish,read}={}){
 const calls=[];let n=0;
 const client={auth:{getUser:async()=>({data:{user:{id:'author'}}})},storage:{from:bucket=>({upload:async(path)=>{calls.push(['upload',bucket,path]);return{};},remove:async paths=>{calls.push(['remove',...paths]);return{};}})},rpc:async(name,args)=>{calls.push([name,args]);if(name==='rr_get_own_experience')return read?read(args):{data:null};if(name==='rr_save_experience_form')return publish?publish(args):{data:{id:args.p_id}};return{data:{id:args.p_id}};}};
 const service=createExperiencePublication(client,{uuid:()=>`photo-${++n}`,optimize:async file=>{calls.push(['compress',file.name]);if(file.bad)throw new Error('Imagem inválida');return {type:'image/webp',size:100};}});
 return {service,calls,client};
}
test('valida data não futura, relato 500, fotos, capa, Instagram antes de enviar',()=>{
 for(const patch of [{visitedOn:'2999-01-01'},{visitedOn:'2026-02-30'},{note:'x'.repeat(501)},{photos:[null,null]},{coverIndex:null}])assert.throws(()=>validateExperienceDraft({...draft(),...patch}));
 assert.doesNotThrow(()=>validateExperienceDraft({...draft(),placeData:{...draft().placeData,location_confirmed:false}}));
 assert.throws(()=>normalizeInstagram('https://site-invalido.com/teste'),/Instagram/);
 assert.equal(normalizeInstagram('@lugar.teste'),'https://www.instagram.com/lugar.teste/');
 assert.equal(validateExperienceDraft(draft()).note,'Minha experiência.');assert.equal(localToday(new Date('2026-10-31T01:00:00Z')),'2026-10-30');
});
test('localização geográfica com referência funciona sem endereço e sem coordenada inventada',()=>{
 const p={name:'Praia de teste',category:'Praia',municipality:'Cairu',state:'BA',lat:'-13.58',lng:'-38.91',location_reference:'Entrada da praia',location_confirmed:true};
 const value=validateExperienceDraft({...draft(),placeData:p});assert.equal(value.place.address,undefined);assert.equal(value.place.lat,-13.58);
 assert.throws(()=>validateExperienceDraft({...draft(),placeData:{...p,lat:''}}),/latitude/);
 assert.throws(()=>validateExperienceDraft({...draft(),placeData:{...p,location_reference:''}}),/referência/);
 assert.deepEqual(experienceCoordinates({address:'Ponto confirmado: -13.58, -38.91'}),{lat:-13.58,lng:-38.91});
 assert.equal(experienceCoordinates({address:'Rua Um, 1'}),null);
 assert.equal(experienceCoordinates({lat:'',lng:''}),null);
 assert.deepEqual(experienceCoordinates({address:'Ponto confirmado: -1e-7, -38.91'}),{lat:-0.0000001,lng:-38.91});
});
test('as duas compressões precedem uploads; uma única RPC serve os dois pontos de entrada',async()=>{
 const {service,calls}=setup();await service.save(draft());assert.deepEqual(calls.slice(0,2).map(c=>c[0]),['compress','compress']);
 assert.equal(calls.filter(c=>c[0]==='upload').length,2);const rpc=calls.find(c=>c[0]==='rr_save_experience_form');
 assert.equal(rpc[1].p.photos.length,2);assert.equal(rpc[1].p.cover_index,0);assert.equal(rpc[1].p.request_token,'experience-id');
});
test('imagem inválida e publicação incompleta não causam uploads nem gravação',async()=>{
 const {service,calls}=setup();await assert.rejects(service.save({...draft(),photos:[{file:{name:'bad',bad:true}},{file:{name:'two'}}]}),/inválida/);
 assert.equal(calls.some(c=>c[0]==='upload'),false);await assert.rejects(service.save({...draft(),note:''}));assert.equal(calls.some(c=>c[0]==='rr_save_experience_form'),false);
});
test('falha determinística remove somente uploads novos; fotos antigas ficam intactas',async()=>{
 const {service,calls}=setup({publish:async()=>({error:{code:'40001'}})});const input=draft();input.photos[0]={storage_path:'author/old.webp'};
 await assert.rejects(service.save(input),/outra sessão/);const removed=calls.find(c=>c[0]==='remove');assert.equal(removed.length,2);assert.notEqual(removed[1],'author/old.webp');
});
test('resposta perdida depois do COMMIT é recuperada sem duplicar nem apagar fotos',async()=>{
 let saved;const {service,calls}=setup({publish:async args=>{saved={...args.p,id:args.p_id,user_id:'author',version:2,photos:args.p.photos.map((p,i)=>({...p,is_cover:i===args.p.cover_index}))};return{error:{message:'Failed to fetch'}};},read:async()=>({data:saved})});
 const row=await service.save(draft());assert.equal(row.id,'experience-id');assert.equal(calls.some(c=>c[0]==='remove'),false);assert.equal(calls.filter(c=>c[0]==='rr_save_experience_form').length,1);
});
test('envio ambíguo é mantido para nova tentativa com as mesmas fotos e identidade',async()=>{
 let network=true;const {service,calls}=setup({publish:async args=>network?{error:{message:'Network'}}:{data:{id:args.p_id}},read:async()=>({data:null})});
 await assert.rejects(service.save(draft()),e=>e.pending===true);assert.equal(calls.some(c=>c[0]==='remove'),false);network=false;
 assert.equal((await service.retry('experience-id')).id,'experience-id');assert.equal(calls.filter(c=>c[0]==='upload').length,2);
});
test('edição ambígua de dicas não é confundida com a versão anterior',async()=>{
 const d={...draft(),version:2,tips:'Nova dica',photos:[{storage_path:'author/one.webp'},{storage_path:'author/two.webp'}]};
 const {service}=setup({publish:async()=>({error:{message:'Network'}}),read:async()=>({data:{id:d.id,user_id:'author',request_token:d.id,version:2,note:d.note,visited_on:d.visitedOn,tips:'',how_to_get:{},photos:d.photos.map((p,i)=>({...p,is_cover:i===0}))}})});
 await assert.rejects(service.save(d),e=>e.pending===true);
});
test('legado edita relato sem exigir data/fotos e sem passar por uploads',async()=>{
 const {service,calls}=setup();await service.save({id:'old',version:1,legacy:true,note:'Texto atualizado.',howToGet:{},tips:''});
 assert.equal(calls[0][0],'rr_edit_legacy_experience');assert.equal(calls.some(c=>c[0]==='upload'),false);
});
