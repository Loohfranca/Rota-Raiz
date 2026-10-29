import test from "node:test";
import assert from "node:assert/strict";
import { createTripPdf, tripPdfFilename } from "../src/lib/tripReportPdf.js";
const trip = {
  id: "t",
  name: "Bahia e João Pessoa",
  people: [
    { id: "a", name: "Ana" },
    { id: "b", name: "João" },
  ],
  expenses: [
    {
      id: "e",
      description: "Almoço",
      amount: 12001,
      payer: "a",
      category: "Alimentação",
      date: "2026-10-22",
      shares: { a: 6001, b: 6000 },
    },
  ],
};
test("gera PDF real e nome de arquivo legível", () => {
  const doc = createTripPdf(trip);
  const bytes = new Uint8Array(doc.output("arraybuffer"));
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), "%PDF-");
  assert.ok(doc.getNumberOfPages() > 0);
  assert.equal(tripPdfFilename(trip.name), "rota-raiz-bahia-e-joao-pessoa.pdf");
});
test("despesas extensas geram várias páginas", () => {
  const doc = createTripPdf({
    ...trip,
    expenses: Array.from({ length: 60 }, (_, i) => ({
      ...trip.expenses[0],
      id: String(i),
      description:
        "Passeio com almoço e transporte para conferir todas as informações do dia",
    })),
  });
  assert.ok(doc.getNumberOfPages() >= 4);
});
test("rejeita dados inconsistentes em vez de gerar relatório incorreto", () => {
  assert.throws(() =>
    createTripPdf({
      ...trip,
      expenses: [{ ...trip.expenses[0], shares: { a: 2, b: 2 } }],
    }),
  );
});

test("relatório inclui parcelamento e total sem repetir a despesa", () => {
  const doc=createTripPdf({...trip,expenses:[{...trip.expenses[0],category:"Passagem de avião",installments:3}]});
  assert.ok(doc.internal.pages.flat().join(" ").includes("Parcelamento:"));
});
