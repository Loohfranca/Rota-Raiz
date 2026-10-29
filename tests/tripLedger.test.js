import test from "node:test";
import assert from "node:assert/strict";
import {
  parseMoney,
  installmentLabel,
  splitAmount,
  summarize,
  validateTrips,
} from "../src/lib/tripLedger.js";
const people = [
  { id: "a", name: "Ana" },
  { id: "b", name: "Bia" },
];
const expense = (id, amount, payer, category = "Alimentação") => ({
  id,
  description: id,
  amount,
  payer,
  category,
  date: "2026-10-22",
  shares: splitAmount(amount, ["a", "b"]),
});
test("valores em reais, sem ambiguidades ou arredondamento silencioso", () => {
  assert.equal(parseMoney("120,50"), 12050);
  assert.equal(parseMoney("0.01"), 1);
  for (const bad of ["0", "-1", "1.234", "1.000,00", "NaN", "1e3", ""])
    assert.throws(() => parseMoney(bad));
});
test("a divisão conserva cada centavo inclusive para três pessoas", () => {
  assert.deepEqual(splitAmount(100, ["a", "b", "c"]), { a: 34, b: 33, c: 33 });
  assert.deepEqual(splitAmount(1, ["a", "b"]), { a: 1, b: 0 });
  assert.throws(() => splitAmount(100, []));
});
test("compensa pagamentos cruzados e separa categorias", () => {
  const result = summarize({
    people,
    expenses: [
      expense("almoço", 12000, "a"),
      expense("ônibus", 4000, "b", "Transporte"),
    ],
  });
  assert.equal(result.total, 16000);
  assert.equal(result.categories.Alimentação, 12000);
  assert.equal(result.categories.Transporte, 4000);
  assert.deepEqual(result.settlements, [
    { from: "Bia", to: "Ana", amount: 4000 },
  ]);
  assert.equal(
    result.people.reduce((s, p) => s + p.balance, 0),
    0,
  );
});
test("partes personalizadas e vários credores conservam saldo", () => {
  const result = summarize({
    people: [...people, { id: "c", name: "Caio" }],
    expenses: [
      {
        ...expense("hotel", 10001, "a"),
        shares: { a: 2000, b: 3000, c: 5001 },
      },
      { ...expense("taxi", 3333, "b"), shares: { a: 1111, b: 1111, c: 1111 } },
    ],
  });
  assert.equal(
    result.people.reduce((s, p) => s + p.balance, 0),
    0,
  );
  assert.equal(
    result.settlements.reduce((s, p) => s + p.amount, 0),
    result.people
      .filter((p) => p.balance > 0)
      .reduce((s, p) => s + p.balance, 0),
  );
});
test("restauração rejeita referências, somas e duplicatas inválidas", () => {
  const trip = {
    id: "t",
    name: "Viagem",
    people,
    expenses: [expense("e", 101, "a")],
  };
  assert.deepEqual(validateTrips([trip]), [trip]);
  for (const change of [
    { payer: "estranho" },
    { shares: { a: 50, b: 50 } },
    { amount: NaN },
    { shares: { a: 102, b: -1 } },
    { category: "inexistente" },
    { date: "2026-02-31" },
  ])
    assert.throws(() =>
      validateTrips([
        { ...trip, expenses: [{ ...trip.expenses[0], ...change }] },
      ]),
    );
  assert.throws(() => validateTrips([trip, trip]));
  assert.throws(() =>
    validateTrips([{ ...trip, people: [people[0], people[0]] }]),
  );
});
test("média considera o intervalo de registros, inclusive dias sem gasto", () => {
  const result = summarize({
    people,
    expenses: [
      expense("e1", 100, "a"),
      { ...expense("e2", 500, "b"), date: "2026-10-24" },
    ],
  });
  assert.equal(result.days, 3);
  assert.equal(result.average, 200);
});

test("parcelas preservam centavos e total; backups antigos continuam válidos", () => {
  assert.equal(installmentLabel(120000, 6), "6 × R$ 200,00");
  assert.equal(installmentLabel(10001, 3), "2 × R$ 33,34 + 1 × R$ 33,33");
  assert.equal(installmentLabel(100), "À vista");
  const item={...expense("voo",10001,"a","Passagem de avião"),installments:3};
  const trip={id:"t",name:"Teste",people,expenses:[item]};
  validateTrips([trip]);
  assert.equal(summarize(trip).total,10001);
  assert.equal(summarize(trip).categories["Passagem de avião"],10001);
  assert.equal(validateTrips(JSON.parse(JSON.stringify([trip])))[0].expenses[0].installments,3);
  for (const installments of [null,"3",0,-1,1.5,61,10002])
    assert.throws(()=>validateTrips([{...trip,expenses:[{...item,installments}]}]));
});
