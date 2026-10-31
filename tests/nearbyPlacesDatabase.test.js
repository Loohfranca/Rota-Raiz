import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {fixture} from './fixtures/publishedUnifiedSchema.js';
test('busca próxima respeita raio, limite, registros removidos e RLS sem modificar dados',async()=>{
 const db=await fixture();try{
 for(const file of ['20261031022251_unified_experiences_20261030.sql','20261031024134_internal_place_search.sql','20261031040314_confirmed_place_nearby.sql'])await db.exec(fs.readFileSync(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
 const user='11111111-1111-4111-8111-111111111111';await db.query('insert into auth.users(id) values($1)',[user]);
 for(let i=0;i<12;i++)await db.query("insert into public.rr_places(name,category,city,state,address,lat,lng,created_by) values($1,'Praia','Cairu','BA',$2,$3,-38,$4)",['Praia '+i,'Referência '+i,-13+i*0.0001,user]);
 await db.query("insert into public.rr_places(name,category,city,state,address,lat,lng,created_by,deleted_at) values('Removida','Praia','Cairu','BA','Outro',-13,-38,$1,now()),('Distante','Praia','Cairu','BA','Longe',-14,-38,$1,null)",[user]);
 const before=(await db.query('select count(*)::int n from public.rr_places')).rows[0].n;
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);await db.exec('set role authenticated');
 const rows=(await db.query('select public.rr_nearby_places(-13,-38) r')).rows[0].r;assert.equal(rows.length,8);assert.equal(rows[0].distance_m,0);assert.equal(rows[0].municipality,'Cairu');assert.ok(rows.every(p=>p.distance_m<=1500&&!['Removida','Distante'].includes(p.name)));
 assert.deepEqual((await db.query('select public.rr_nearby_places(0,0) r')).rows[0].r,[]);
 for(const expr of ['null,0','91,0',"'NaN'::float8,0"])await assert.rejects(db.query('select public.rr_nearby_places('+expr+')'));
 await db.exec('reset role;set role anon');await assert.rejects(db.query('select public.rr_nearby_places(-13,-38)'),/permission denied/);
 await db.exec('reset role');assert.equal((await db.query('select count(*)::int n from public.rr_places')).rows[0].n,before);
 await db.exec(fs.readFileSync(new URL('../supabase/rollback/confirmed_place_nearby.sql',import.meta.url),'utf8'));
 assert.equal((await db.query('select count(*)::int n from public.rr_places')).rows[0].n,before);
 }finally{await db.close();}
});
