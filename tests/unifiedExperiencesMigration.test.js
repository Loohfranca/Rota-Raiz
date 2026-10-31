import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const migration = fs.readFileSync(
  new URL("../migrations/20261030_unified_experiences.sql", import.meta.url),
  "utf8",
);

async function fixture() {
  const db = new PGlite();
  await db.exec(
    "create role anon; create role authenticated; create schema auth; " +
    "create table auth.users(id uuid primary key); " +
    "create function auth.uid() returns uuid language sql stable as $$ " +
    "select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; " +
    "create function auth.jwt() returns jsonb language sql stable as $$ " +
    "select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$; " +
    "create function public.rr_display_name() returns text language sql stable as $$ " +
    "select 'Pessoa de teste'::text $$; " +
    "create table public.community_recommendations (" +
    "id uuid primary key,name text not null,category text not null,city text not null," +
    "address text not null,instagram text not null default '',note text not null," +
    "status text not null default 'approved',created_at timestamptz not null default now()," +
    "reviewed_at timestamptz,user_id uuid references auth.users(id)," +
    "author_name text not null default 'Viajante',image_url text," +
    "editorial boolean not null default false); " +
    "create table public.rr_profile_cities (" +
    "id uuid primary key,user_id uuid not null references auth.users(id)," +
    "city text not null,state text not null default '',place_name text not null default ''," +
    "created_at timestamptz not null default now()); " +
    "create table public.rr_profile_photos (" +
    "id uuid primary key,user_id uuid not null references auth.users(id)," +
    "city_id uuid not null references public.rr_profile_cities(id)," +
    "storage_path text not null unique,caption text not null default ''," +
    "created_at timestamptz not null default now()); " +
    "create table public.community_likes (" +
    "recommendation_id uuid not null references public.community_recommendations(id)," +
    "user_id uuid not null references auth.users(id),created_at timestamptz not null default now()," +
    "primary key(recommendation_id,user_id)); " +
    "create table public.community_comments (" +
    "id uuid primary key,recommendation_id uuid not null references public.community_recommendations(id)," +
    "user_id uuid not null references auth.users(id),author_name text not null,body text not null," +
    "created_at timestamptz not null default now()); " +
    "alter table public.community_recommendations enable row level security; " +
    "alter table public.community_comments enable row level security; " +
    "create policy rr_community_read on public.community_recommendations " +
    "for select to authenticated using(status='approved'); " +
    "create policy community_comments_read on public.community_comments " +
    "for select to authenticated using(true); " +
    "create function public.rr_classify_text(p_body text) returns text " +
    "language sql immutable as $$ select null::text $$;"
  );
  return db;
}

test("Parte 2 preserva IDs e engajamento e vincula experiências pela identidade exata", async () => {
  const db = await fixture();
  try {
    const userA = "11111111-1111-4111-8111-111111111111";
    const userB = "22222222-2222-4222-8222-222222222222";
    const recA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const recB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const legacyCity = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const commentId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

    await db.query("insert into auth.users(id) values ($1),($2)", [userA,userB]);
    await db.query(
      "insert into public.community_recommendations " +
      "(id,name,category,city,address,note,user_id,author_name,status,reviewed_at) values " +
      "($1,'Café da Praça','Comida','João Pessoa, PB','Rua das Flores, 10, 58000-000','Relato A',$3,'Pessoa A','approved',now())," +
      "($2,'Cafe da Praca','Comida','joao pessoa, pb','R. das Flores, 10, 58000-0000','Relato B',$4,'Pessoa B','approved',now())",
      [recA,recB,userA,userB],
    );
    await db.query(
      "insert into public.community_likes(recommendation_id,user_id) values ($1,$2)",
      [recA,userB],
    );
    await db.query(
      "insert into public.community_comments(id,recommendation_id,user_id,author_name,body) values ($1,$2,$3,'Pessoa B','Comentário preservado')",
      [commentId,recA,userB],
    );
    await db.query(
      "insert into public.rr_profile_cities(id,user_id,city,state,place_name) values ($1,$2,'Petrópolis','RJ','Petrópolis')",
      [legacyCity,userA],
    );

    await db.exec(migration);
    await db.exec(migration);

    const links = await db.query(
      "select id,place_id from public.community_recommendations where id in ($1,$2) order by id",
      [recA,recB],
    );
    assert.equal(links.rows.length,2);
    assert.ok(links.rows[0].place_id);
    assert.equal(links.rows[0].place_id,links.rows[1].place_id);
    assert.equal((await db.query("select count(*)::int as n from public.rr_places")).rows[0].n,1);

    const engagement = await db.query(
      "select (select count(*)::int from public.community_likes where recommendation_id=$1) as likes," +
      "(select count(*)::int from public.community_comments where recommendation_id=$1) as comments",
      [recA],
    );
    assert.deepEqual(engagement.rows[0],{likes:1,comments:1});

    const legacy = await db.query(
      "select place_id from public.rr_profile_cities where id=$1",
      [legacyCity],
    );
    assert.equal(legacy.rows[0].place_id,null);

    const decisions = await db.query(
      "select source_table,place_id,decision from public.rr_place_link_migration_map " +
      "where source_id in ($1,$2,$3) order by source_table,source_id",
      [recA,recB,legacyCity],
    );
    assert.equal(decisions.rows.length,3);
    assert.ok(decisions.rows.some(x =>
      x.source_table==="rr_profile_cities" &&
      x.place_id===null &&
      x.decision==="unlinked_legacy_profile_album_without_verified_address"
    ));
  } finally {
    await db.close();
  }
});

test("API da Parte 2 reutiliza o mesmo lugar e exige data de visita válida", async () => {
  const db = await fixture();
  try {
    const userA = "11111111-1111-4111-8111-111111111111";
    const userB = "22222222-2222-4222-8222-222222222222";
    const visitDate = new Date(Date.now()-86400000).toISOString().slice(0,10);
    await db.query("insert into auth.users(id) values ($1),($2)", [userA,userB]);

    async function publish(userId,note) {
      await db.query("select set_config('request.jwt.claim.sub',$1,false)",[userId]);
      return db.query(
        "select public.rr_publish_experience($1::jsonb) as result",
        [JSON.stringify({
          name:"Restaurante do Centro",category:"Comida",address:"Rua A, 20",
          city:"Niterói",state:"RJ",instagram:"",note,visit_date:visitDate,
        })],
      );
    }

    const first = await publish(userA,"Minha experiência");
    const second = await publish(userB,"Outra experiência");
    assert.ok(first.rows[0].result.place_id);
    assert.equal(first.rows[0].result.place_id,second.rows[0].result.place_id);

    await assert.rejects(
      db.query("select public.rr_publish_experience($1::jsonb)",[
        JSON.stringify({name:"Lugar sem data",category:"Praia",address:"Praia",city:"Niterói",state:"RJ",note:"Sem data"})
      ]),
      /Informe a data da visita/,
    );
    await assert.rejects(
      db.query("select public.rr_publish_experience($1::jsonb)",[
        JSON.stringify({name:"Lugar futuro",category:"Praia",address:"Praia",city:"Niterói",state:"RJ",note:"Data futura",visit_date:"2099-01-01"})
      ]),
      /não pode estar no futuro/,
    );
  } finally {
    await db.close();
  }
});

test("exclusão lógica mantém publicação, curtidas e comentários recuperáveis", async () => {
  const db = await fixture();
  try {
    const userA = "11111111-1111-4111-8111-111111111111";
    const userB = "22222222-2222-4222-8222-222222222222";
    const recId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const commentId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
    await db.query("insert into auth.users(id) values ($1),($2)",[userA,userB]);
    await db.query(
      "insert into public.community_recommendations " +
      "(id,name,category,city,address,note,user_id,author_name,status,reviewed_at) " +
      "values ($1,'Praia','Praia','Niterói','Praia','Relato',$2,'Pessoa A','approved',now())",
      [recId,userA],
    );
    await db.query(
      "insert into public.community_likes(recommendation_id,user_id) values ($1,$2)",
      [recId,userB],
    );
    await db.query(
      "insert into public.community_comments(id,recommendation_id,user_id,author_name,body) values ($1,$2,$3,'Pessoa B','Comentário')",
      [commentId,recId,userB],
    );
    await db.exec(migration);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[userA]);
    await db.query("select public.rr_soft_delete_experience($1)",[recId]);

    const deleted = await db.query(
      "select deleted_at is not null as hidden,version from public.community_recommendations where id=$1",
      [recId],
    );
    assert.equal(deleted.rows[0].hidden,true);
    assert.equal(Number(deleted.rows[0].version),2);

    const preserved = await db.query(
      "select (select count(*)::int from public.community_likes where recommendation_id=$1) as likes," +
      "(select count(*)::int from public.community_comments where recommendation_id=$1) as comments",
      [recId],
    );
    assert.deepEqual(preserved.rows[0],{likes:1,comments:1});

    await db.query("select public.rr_restore_experience($1)",[recId]);
    const restored = await db.query(
      "select deleted_at from public.community_recommendations where id=$1",
      [recId],
    );
    assert.equal(restored.rows[0].deleted_at,null);
  } finally {
    await db.close();
  }
});

test("banco limita duas fotos e uma capa por experiência", async () => {
  const db = await fixture();
  try {
    const userA = "11111111-1111-4111-8111-111111111111";
    const recId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    await db.query("insert into auth.users(id) values ($1)",[userA]);
    await db.query(
      "insert into public.community_recommendations " +
      "(id,name,category,city,address,note,user_id,author_name,status,reviewed_at) " +
      "values ($1,'Praia','Praia','Niterói','Praia','Relato',$2,'Pessoa A','approved',now())",
      [recId,userA],
    );
    await db.exec(migration);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[userA]);
    await db.query(
      "insert into public.rr_experience_photos(experience_id,user_id,storage_path,position,is_cover) " +
      "values ($1,$2,$3,1,true),($1,$2,$4,2,false)",
      [recId,userA,userA+"/foto-1.webp",userA+"/foto-2.webp"],
    );
    await assert.rejects(
      db.query(
        "insert into public.rr_experience_photos(experience_id,user_id,storage_path,position,is_cover) " +
        "values ($1,$2,$3,1,false)",
        [recId,userA,userA+"/foto-3.webp"],
      ),
      /no máximo duas fotografias/,
    );
    await assert.rejects(
      db.query(
        "insert into public.rr_experience_photos(experience_id,user_id,storage_path,position,is_cover) " +
        "values ($1,$2,$3,2,true)",
        [recId,userA,userA+"/foto-4.webp"],
      ),
      /já possui uma fotografia de capa/,
    );
  } finally {
    await db.close();
  }
});
