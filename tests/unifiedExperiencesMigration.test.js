import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const migration = fs.readFileSync(
  new URL("../supabase/migrations/20261030220000_unified_experiences.sql", import.meta.url),
  "utf8",
);

async function fixture() {
  const db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable
      as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function public.rr_display_name() returns text language sql stable
      as $$ select 'Pessoa de teste'::text $$;
    create schema storage;
    create table storage.objects(
      id uuid primary key default gen_random_uuid(), bucket_id text not null,
      name text not null, owner uuid, owner_id text, is_delete_marker boolean default false
    );
    create table public.community_recommendations(
      id uuid primary key, name text not null, category text not null, city text not null,
      address text not null, instagram text not null default '', note text not null,
      status text not null default 'pending', created_at timestamptz not null default now(),
      reviewed_at timestamptz, user_id uuid references auth.users(id),
      author_name text not null default 'Viajante', image_url text, editorial boolean not null default false
    );
    create table public.rr_profile_cities(
      id uuid primary key, user_id uuid not null references auth.users(id),
      city text not null, state text not null default '', place_name text not null default '',
      created_at timestamptz not null default now()
    );
    create table public.community_likes(
      recommendation_id uuid not null references public.community_recommendations(id),
      user_id uuid not null references auth.users(id), created_at timestamptz default now(),
      primary key(recommendation_id,user_id)
    );
    create table public.community_comments(
      id uuid primary key, recommendation_id uuid not null references public.community_recommendations(id),
      user_id uuid not null references auth.users(id), author_name text not null,
      body text not null, created_at timestamptz default now()
    );
    alter table public.community_recommendations enable row level security;
    alter table public.community_comments enable row level security;
    create policy rr_community_read on public.community_recommendations
      for select to authenticated using(status='approved');
    create policy community_comments_read on public.community_comments
      for select to authenticated using(true);
  `);
  return db;
}

const userA="11111111-1111-4111-8111-111111111111";
const userB="22222222-2222-4222-8222-222222222222";
const recA="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const recB="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const recC="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const recD="ffffffff-ffff-4fff-8fff-ffffffffffff";
const legacy="cccccccc-cccc-4ccc-8ccc-cccccccccccc";

test("migração é idempotente e preserva IDs, curtidas, comentários e álbuns antigos",async()=>{
  const db=await fixture();
  try{
    await db.query("insert into auth.users(id) values($1),($2)",[userA,userB]);
    await db.query(`insert into public.community_recommendations
      (id,name,category,city,address,note,user_id,author_name,status,reviewed_at)
      values
      ($1,'Café da Praça','Comida','João Pessoa, PB','Rua das Flores, 10, 58000-000','Relato A',$3,'Pessoa A','approved',now()),
      ($2,'Cafe da Praca','Comida','joao pessoa, pb','R. das Flores, 10, 58000-0000','Relato B',$4,'Pessoa B','approved',now()),
      ($5,'Praia do Satu','Praia','Caraíva, BA','Praia do Satu, Caraíva, Porto Seguro - BA','Relato C',$3,'Pessoa A','approved',now()),
      ($6,'Barra do Rio Caraíva','Praia','Caraíva, BA','Encontro do Rio Caraíva com o mar, Caraíva - BA','Relato D',$3,'Pessoa A','approved',now()),
      ('99999999-9999-4999-8999-999999999999','Moreré','Praia','Bahia','Ilha de Boipeba','Sem município/UF',$3,'Pessoa A','approved',now())`,
      [recA,recB,userA,userB,recC,recD]);
    await db.query("insert into public.community_likes(recommendation_id,user_id) values($1,$2)",[recA,userB]);
    await db.query("insert into public.community_comments(id,recommendation_id,user_id,author_name,body) values($1,$2,$3,'Pessoa B','Comentário preservado')",
      ["eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",recA,userB]);
    await db.query("insert into public.rr_profile_cities(id,user_id,city,state,place_name) values($1,$2,'Petrópolis','RJ','Petrópolis')",[legacy,userA]);

    await db.exec(migration);
    await db.exec(migration);

    const linked=await db.query("select id,place_id from public.community_recommendations where id in($1,$2) order by id",[recA,recB]);
    assert.equal(linked.rows.length,2);
    assert.ok(linked.rows[0].place_id);
    assert.equal(linked.rows[0].place_id,linked.rows[1].place_id);
    assert.equal((await db.query("select count(*)::int n from public.rr_places")).rows[0].n,2);
    const derivedCity=await db.query("select p.city,p.state from public.community_recommendations r join public.rr_places p on p.id=r.place_id where r.id=$1",[recC]);
    assert.deepEqual(derivedCity.rows[0],{city:"Porto Seguro",state:"BA"});
    const ambiguousLocality=await db.query("select place_id from public.community_recommendations where id=$1",[recD]);
    assert.equal(ambiguousLocality.rows[0].place_id,null);

    const incomplete=await db.query("select place_id from public.community_recommendations where name='Moreré'");
    assert.equal(incomplete.rows[0].place_id,null);
    const oldAlbum=await db.query("select place_id from public.rr_profile_cities where id=$1",[legacy]);
    assert.equal(oldAlbum.rows[0].place_id,null);

    const engagement=await db.query(`select
      (select count(*)::int from public.community_likes where recommendation_id=$1) likes,
      (select count(*)::int from public.community_comments where recommendation_id=$1) comments`,[recA]);
    assert.deepEqual(engagement.rows[0],{likes:1,comments:1});
    assert.equal((await db.query("select count(*)::int n from public.rr_place_link_migration_map")).rows[0].n,6);
  }finally{await db.close();}
});

test("publicação grava lugar, experiência e exatamente duas fotos em uma transação",async()=>{
  const db=await fixture();
  try{
    await db.exec(migration);
    await db.query("insert into auth.users(id) values($1),($2)",[userA,userB]);
    for(const [user,suffix] of [[userA,"a"],[userB,"b"]]){
      await db.query("insert into storage.objects(bucket_id,name,owner,owner_id) values('community-photos',$1,$2::uuid,$2::uuid::text),('community-photos',$3,$2::uuid,$2::uuid::text)",
        [user+"/"+suffix+"1.webp",user,user+"/"+suffix+"2.webp"]);
    }
    async function publish(user,note,suffix){
      await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);
      return db.query("select public.rr_publish_experience($1::jsonb) result",[
        JSON.stringify({
          name:"Restaurante do Centro",category:"Comida",address:"Rua A, 20",city:"Niterói",state:"RJ",
          note,visit_date:"2026-10-20",
          photos:[
            {storage_path:user+"/"+suffix+"1.webp",caption:"Capa",is_cover:true},
            {storage_path:user+"/"+suffix+"2.webp",caption:"Outra foto",is_cover:false}
          ]
        })
      ]);
    }
    const a=await publish(userA,"Minha experiência","a");
    const b=await publish(userB,"Outra experiência","b");
    const aResult=a.rows[0].result,bResult=b.rows[0].result;
    assert.equal(aResult.place_id,bResult.place_id);
    assert.notEqual(aResult.id,bResult.id);
    const photos=await db.query("select count(*)::int n,count(*) filter(where is_cover)::int covers from public.rr_experience_photos where experience_id=$1",[aResult.id]);
    assert.deepEqual(photos.rows[0],{n:2,covers:1});

    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[userA]);
    const secondPhoto=(await db.query("select id from public.rr_experience_photos where experience_id=$1 order by position desc limit 1",[aResult.id])).rows[0].id;
    await db.query("select public.rr_set_experience_cover($1,$2)",[aResult.id,secondPhoto]);
    assert.equal((await db.query("select count(*)::int n from public.rr_experience_photos where experience_id=$1 and is_cover",[aResult.id])).rows[0].n,1);

    await assert.rejects(db.query("select public.rr_publish_experience($1::jsonb)",[
      JSON.stringify({name:"Lugar sem data",category:"Praia",address:"Praia",city:"Niterói",state:"RJ",note:"Sem data"})
    ]));
    await db.query("select public.rr_soft_delete_experience($1)",[aResult.id]);
    assert.equal((await db.query("select count(*)::int n from public.rr_experience_photos where experience_id=$1",[aResult.id])).rows[0].n,2);
    await db.query("select public.rr_restore_experience($1)",[aResult.id]);
  }finally{await db.close();}
});
