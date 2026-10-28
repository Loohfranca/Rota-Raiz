import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';let db,id,version;
before(async()=>{db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);await db.query('insert into auth.users values($1),($2)',[A,B]);await db.exec(readFileSync(new URL('../supabase/migrations/20261028030855_travel_itineraries.sql',import.meta.url),'utf8'));await db.exec(readFileSync(new URL('../supabase/migrations/20261028033611_itinerary_delete_policy.sql',import.meta.url),'utf8'));});
after(()=>db.close());
async function login(who){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[who]);await db.exec('set role authenticated');}
test('roteiro pertence à sessão; outro usuário não consegue ler, alterar ou criar em nome alheio',async()=>{await login(A);const r=await db.query("insert into public.travel_itineraries(title) values('Bahia') returning *");id=r.rows[0].id;version=r.rows[0].version;assert.equal(r.rows[0].owner_id,A);await login(B);assert.equal((await db.query('select * from public.travel_itineraries')).rows.length,0);assert.equal((await db.query("update public.travel_itineraries set title='Inválido' where id=$1 returning id",[id])).rows.length,0);await assert.rejects(db.query("insert into public.travel_itineraries(title,owner_id) values('Invasão',$1)",[A]),/row-level security/);});
test('versão aumenta e uma edição antiga não sobrescreve a nova',async()=>{await login(A);const r=await db.query('update public.travel_itineraries set title=$1 where id=$2 and version=$3 returning *',['Novo nome',id,version]);assert.equal(Number(r.rows[0].version),Number(version)+1);assert.equal((await db.query('update public.travel_itineraries set title=$1 where id=$2 and version=$3 returning id',['Antigo',id,version])).rows.length,0);});
test('banco valida conexões negativas e não permite transferir a propriedade',async()=>{await login(A);const segments=[{from:'Rio',to:'Salvador',departure:'2026-11-01T10:00',arrival:'2026-11-01T12:00',fromZone:'America/Sao_Paulo',toZone:'America/Bahia'},{from:'Salvador',to:'João Pessoa',departure:'2026-11-01T11:00',arrival:'2026-11-01T13:00',fromZone:'America/Bahia',toZone:'America/Fortaleza'}];await assert.rejects(db.query('update public.travel_itineraries set legs=$1 where id=$2',[JSON.stringify([{id:'leg',mode:'flight',segments,status:'planned',company:'',comment:''}]),id]),/ordem dos horários/);await assert.rejects(db.query('update public.travel_itineraries set owner_id=$1 where id=$2',[B,id]),/transferido/);});
test('anônimos não leem roteiros',async()=>{await db.exec('reset role;set role anon');await assert.rejects(db.query('select * from public.travel_itineraries'),/permission denied/);});


test('excluir e restaurar preservam os dados e respeitam o dono e a versão',async()=>{
 await login(A);const current=(await db.query('select * from public.travel_itineraries where id=$1',[id])).rows[0];
 const deleted=(await db.query('update public.travel_itineraries set deleted_at=now() where id=$1 and version=$2 returning *',[id,current.version])).rows[0];
 assert.equal((await db.query('select * from public.travel_itineraries where deleted_at is null')).rows.length,0);
 await login(B);assert.equal((await db.query('update public.travel_itineraries set deleted_at=null where id=$1 returning id',[id])).rows.length,0);
 await login(A);const restored=(await db.query('update public.travel_itineraries set deleted_at=null where id=$1 and version=$2 returning *',[id,deleted.version])).rows[0];assert.equal(restored.title,current.title);assert.equal(restored.deleted_at,null);
});
