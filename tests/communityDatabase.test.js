import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
test("migração isolada cria a comunidade com autoria e acesso autenticado", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;`,
    );
    const sql = fs.readFileSync(
      new URL("../migrations/20261025_community_feed.sql", import.meta.url),
      "utf8",
    );
    await db.exec(sql);
    await db.exec(sql);
    const id = "11111111-1111-4111-8111-111111111111";
    await db.query("insert into auth.users values($1)", [id]);
    await db.query(
      "select set_config('request.jwt.claim.sub',$1,false), set_config('request.jwt.claims',$2,false)",
      [id, JSON.stringify({ sub: id, user_metadata: { full_name: "Luana" } })],
    );
    await db.exec("set role authenticated");
    const r = await db.query(
      "select public.rr_publish_recommendation($1::jsonb) as row",
      [
        JSON.stringify({
          name: "Lugar de teste",
          category: "Comida",
          city: "João Pessoa",
          address: "Rua de teste, 1",
          note: "Boa indicação",
          author_name: "Forjado",
        }),
      ],
    );
    assert.equal(r.rows[0].row.author_name, "Luana");
    assert.equal(r.rows[0].row.user_id, id);
    assert.equal(
      (
        await db.query(
          "select count(*)::int as n from public.community_recommendations",
        )
      ).rows[0].n,
      1,
    );
    await db.exec("reset role; set role anon");
    await assert.rejects(
      db.query("select public.rr_publish_recommendation($1::jsonb)", ["{}"]),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
