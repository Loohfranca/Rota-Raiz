import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222",
  C = "33333333-3333-4333-8333-333333333333";
const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
let db, invite, firstTrip, forC;
const migration = fs.readFileSync(
  new URL("../supabase/migrations/20261026203542_finance_accounts.sql", import.meta.url),
  "utf8",
);
async function login(id, name) {
  await db.exec("reset role");
  await db.query(
    "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",
    [id, JSON.stringify({ sub: id, user_metadata: { full_name: name } })],
  );
  await db.exec("set role authenticated");
}
async function rpc(name, args = [], casts = []) {
  const q = `select public.${name}(${args.map((_, i) => `$${i + 1}${casts[i] || ""}`).join(",")}) as result`;
  const r = await db.query(q, args);
  return r.rows[0].result;
}
before(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;`,
  );
  await db.query("insert into auth.users values($1),($2),($3)", [A, B, C]);
  await db.exec(
    fs.readFileSync(
      new URL("../migrations/20261022_community.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(fs.readFileSync(new URL("../migrations/20261025_community_feed.sql", import.meta.url), "utf8"));
  await db.exec(migration);
  await db.exec(fs.readFileSync(new URL("../supabase/migrations/20261029144219_expense_installments.sql", import.meta.url), "utf8"));
});
after(async () => {
  await db.close();
});
test("indicação recebe autoria da sessão e aparece para outra conta, sem revisão", async () => {
  await login(A, "Luana França");
  const row = await rpc(
    "rr_publish_recommendation",
    [
      JSON.stringify({
        name: "Restaurante de teste",
        category: "Comida",
        city: "Caraíva",
        address: "Rua pública de teste",
        instagram: "https://www.instagram.com/teste/",
        note: "Dica apenas para testar",
        author_name: "Nome falso",
        user_id: B,
      }),
    ],
    ["::jsonb"],
  );
  assert.equal(row.author_name, "Luana França");
  assert.equal(row.user_id, A);
  assert.equal(row.status, "approved");
  await login(B, "Bia");
  const rows = await db.query("select * from public.community_recommendations");
  assert.equal(rows.rows[0].author_name, "Luana França");
  await assert.rejects(
    db.query(
      "insert into public.community_recommendations(id,name,category,city,address,note) values(gen_random_uuid(),'x','Comida','x','x','x')",
    ),
    /permission denied/,
  );
});
test("viagem e gastos são privados até aceitar o convite", async () => {
  await login(A, "Luana França");
  await rpc(
    "rr_create_trip",
    [
      JSON.stringify({
        id: tripId,
        name: "Bahia juntas",
        people: [
          { id: "a", name: "Luana" },
          { id: "b", name: "Bia" },
        ],
        expenses: [
          {
            id: "e",
            description: "Almoço",
            category: "Alimentação",
            payer: "a",
            amount: 10001,
            date: "2026-10-23",
            shares: { a: 5001, b: 5000 },
          },
        ],
      }),
      "a",
    ],
    ["::jsonb", "::text"],
  );
  firstTrip = (await rpc("rr_list_trips"))[0];
  assert.equal(firstTrip.people[0].name, "Luana França");
  invite = await rpc("rr_create_invite", [tripId, "b"], ["::uuid", "::text"]);
  assert.match(invite, /^[a-f0-9]{64}$/);
  await login(B, "Bia");
  assert.deepEqual(await rpc("rr_list_trips"), []);
  await assert.rejects(
    db.query("select * from public.shared_trips"),
    /permission denied/,
  );
  await assert.rejects(
    db.query("select * from public.trip_invitations"),
    /permission denied/,
  );
  const preview = await rpc("rr_preview_invite", [invite]);
  assert.equal(preview.name, "Bahia juntas");
  assert.equal(preview.inviter, "Luana França");
  await rpc("rr_join_trip", [invite]);
  const joined = (await rpc("rr_list_trips"))[0];
  assert.equal(joined.people.length, 2);
  assert.equal(joined.expenses[0].amount, 10001);
  assert.equal(joined.members.length, 2);
  await login(C, "Caio");
  assert.deepEqual(await rpc("rr_list_trips"), []);
  await assert.rejects(rpc("rr_join_trip", [invite]), /já foi usado/);
});
test("as duas contas veem alterações, centavos são validados e versão evita sobrescrita", async () => {
  await login(B, "Bia");
  const current = (await rpc("rr_list_trips"))[0];
  const updated = {
    ...current,
    expenses: [
      ...current.expenses,
      {
        id: "f",
        description: "Ônibus",
        category: "Transporte",
        payer: "b",
        amount: 4000,
        date: "2026-10-23",
        shares: { a: 2000, b: 2000 },
      },
    ],
  };
  await rpc(
    "rr_save_trip",
    [tripId, current.version, JSON.stringify(updated)],
    ["::uuid", "::bigint", "::jsonb"],
  );
  await login(A, "Luana França");
  let read = (await rpc("rr_list_trips"))[0];
  assert.equal(read.expenses.length, 2);
  await assert.rejects(
    rpc(
      "rr_save_trip",
      [tripId, null, JSON.stringify(updated)],
      ["::uuid", "::bigint", "::jsonb"],
    ),
    /atualizada por outra pessoa/,
  );
  await assert.rejects(
    rpc(
      "rr_save_trip",
      [tripId, current.version, JSON.stringify(updated)],
      ["::uuid", "::bigint", "::jsonb"],
    ),
    /atualizada por outra pessoa/,
  );
  await assert.rejects(
    rpc(
      "rr_save_trip",
      [
        tripId,
        read.version,
        JSON.stringify({
          ...read,
          expenses: [{ ...read.expenses[0], shares: { a: 5000, b: 5000 } }],
        }),
      ],
      ["::uuid", "::bigint", "::jsonb"],
    ),
    /divisão não corresponde/,
  );
  await assert.rejects(
    rpc(
      "rr_save_trip",
      [
        tripId,
        read.version,
        JSON.stringify({ ...read, people: [read.people[0]], expenses: [] }),
      ],
      ["::uuid", "::bigint", "::jsonb"],
    ),
    /Sair da viagem/,
  );
  forC = await rpc("rr_create_invite", [tripId, null], ["::uuid", "::text"]);
  await login(C, "Caio");
  await rpc("rr_join_trip", [forC]);
  read = (await rpc("rr_list_trips"))[0];
  assert.equal(read.people.length, 3);
  assert.equal(
    Object.keys(read.expenses[0].shares).length,
    2,
    "entrada não divide gastos anteriores retroativamente",
  );
});
test("sair retira acesso, mantém os gastos para quem ficou e impede reutilizar convite", async () => {
  await login(B, "Bia");
  const old = (await rpc("rr_list_trips"))[0];
  await rpc("rr_leave_trip", [tripId], ["::uuid"]);
  assert.deepEqual(await rpc("rr_list_trips"), []);
  await assert.rejects(
    rpc(
      "rr_save_trip",
      [tripId, old.version, JSON.stringify(old)],
      ["::uuid", "::bigint", "::jsonb"],
    ),
    /não participa/,
  );
  await assert.rejects(rpc("rr_join_trip", [invite]), /novo convite/);
  await assert.rejects(rpc("rr_preview_invite", [invite]), /expirou/);
  await login(A, "Luana França");
  const kept = (await rpc("rr_list_trips"))[0];
  assert.equal(kept.expenses.length, 2);
  assert.ok(kept.people.some((p) => p.id === "b"));
  await rpc("rr_leave_trip", [tripId], ["::uuid"]);
  assert.deepEqual(
    await rpc("rr_list_trips"),
    [],
    "nem o criador mantém acesso após sair",
  );
  await login(C, "Caio");
  assert.equal((await rpc("rr_list_trips"))[0].expenses.length, 2);
});
test("convite expirado e sessão anônima não acessam dados", async () => {
  await login(C, "Caio");
  const token = await rpc(
    "rr_create_invite",
    [tripId, null],
    ["::uuid", "::text"],
  );
  await db.exec(
    "reset role;update public.trip_invitations set expires_at=now()-interval '1 hour' where used_at is null",
  );
  await login(B, "Bia");
  await assert.rejects(rpc("rr_preview_invite", [token]), /expirou/);
  await db.exec("reset role;set role anon");
  await assert.rejects(rpc("rr_list_trips"), /permission denied/);
  await assert.rejects(
    db.query("select * from public.community_recommendations"),
    /permission denied/,
  );
});
test("migração pode ser reaplicada sem apagar viagens ou indicações", async () => {
  await db.exec("reset role");
  await db.exec(migration);
  await db.exec(fs.readFileSync(new URL("../supabase/migrations/20261029144219_expense_installments.sql", import.meta.url), "utf8"));
  await login(C, "Caio");
  assert.equal((await rpc("rr_list_trips"))[0].expenses.length, 2);
  assert.equal(
    (
      await db.query(
        "select count(*)::int as count from public.community_recommendations",
      )
    ).rows[0].count,
    1,
  );
});


test("conta individual fica privada e não pode receber convites nem virar grupo", async () => {
  await login(A, "Luana França");
  const id = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
  const created = await rpc("rr_create_trip", [JSON.stringify({id, name:"Pessoal", scope:"individual", people:[{id:"solo",name:"Luana"}],expenses:[]}),"solo"],["::jsonb","::text"]);
  assert.equal(created.scope,"individual");
  await assert.rejects(rpc("rr_create_invite",[id,null],["::uuid","::text"]),/individuais são privados/);
  await assert.rejects(rpc("rr_save_trip",[id,1,JSON.stringify({...created,scope:"shared"})],["::uuid","::bigint","::jsonb"]),/ficam separados/);
  await login(B,"Bia");
  assert.equal((await rpc("rr_list_trips")).some(t=>t.id===id),false);
  await assert.rejects(db.query("select * from public.shared_trips"),/permission denied/);
});

test("banco aceita avião e parcelas opcionais, rejeita valores inválidos", async () => {
  await db.exec("reset role");
  const ledger={name:"Teste",people:[{id:"a",name:"Ana"}],expenses:[{id:"e",description:"Voo",category:"Passagem de avião",amount:10001,payer:"a",date:"2026-10-29",shares:{a:10001},installments:3}]};
  await rpc("rr_validate_ledger",[JSON.stringify(ledger)],["::jsonb"]);
  for (const installments of [null,"3",0,-1,1.5,61,10002]) {
    const invalid=structuredClone(ledger); invalid.expenses[0].installments=installments;
    await assert.rejects(rpc("rr_validate_ledger",[JSON.stringify(invalid)],["::jsonb"]),/Parcelamento/);
  }
  delete ledger.expenses[0].installments;
  await rpc("rr_validate_ledger",[JSON.stringify(ledger)],["::jsonb"]);
});
