import { jsPDF } from "jspdf";
import { money, summarize, validateTrips, installmentLabel } from "./tripLedger.js";

const green = "#243E32",
  muted = "#596458",
  sand = "#F6F1E8",
  line = "#DED8CD";
// Standard PDF fonts cover Portuguese/WinAnsi. Remove unsupported control and
// pictographic characters rather than output corrupted font codes.
const text = (value) =>
  String(value)
    .replace(/\u00a0/g, " ")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/→/g, " para ")
    .replace(/[^\x20-\x7e\xa1-\xff\n]/gu, "")
    .trim();
export const tripPdfFilename = (name, scope) =>
  `rota-raiz-${scope === "individual" ? "individual-" : scope === "shared" ? "compartilhado-" : ""}${
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70) || "viagem"
  }.pdf`;

export function createTripPdf(trip, generatedAt = new Date()) {
  validateTrips([trip]);
  const stats = summarize(trip),
    doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setProperties({
    title: `Rota Raiz - ${text(trip.name)}`,
    subject: "Resumo de gastos e divisão da viagem",
    author: "Rota Raiz",
  });
  const left = 18,
    right = 192,
    width = 174,
    bottom = 276;
  let y = 0;
  function type(
    value,
    x,
    at,
    size = 10,
    color = green,
    weight = "normal",
    options = {},
  ) {
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
    doc.setTextColor(color);
    doc.text(
      Array.isArray(value) ? value.map(text) : text(value),
      x,
      at,
      options,
    );
  }
  function wrap(value, max, size = 10) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    return doc.splitTextToSize(text(value), max);
  }
  function pageHeader() {
    doc.setFillColor(green);
    doc.rect(0, 0, 210, 22, "F");
    type("rotaraiz", left, 14, 18, "#FFFFFF", "bold");
    type("CADERNO DE VIAGEM", right, 13, 8, "#FFFFFF", "normal", {
      align: "right",
    });
    y = 34;
  }
  function ensure(height) {
    if (y + height > bottom) {
      doc.addPage();
      pageHeader();
    }
  }
  function section(title, height = 24) {
    ensure(height);
    type(title, left, y, 14, green, "bold");
    y += 10;
  }
  function paragraph(value, size = 9, color = muted) {
    const lines = wrap(value, width, size);
    for (const ln of lines) {
      ensure(5);
      type(ln, left, y, size, color);
      y += 4.7;
    }
    y += 3;
  }
  function rule() {
    doc.setDrawColor(line);
    doc.line(left, y, right, y);
    y += 7;
  }
  pageHeader();
  type("RELATÓRIO DA VIAGEM", left, y, 9, muted, "bold");
  y += 10;
  const title = wrap(trip.name, width, 24);
  doc.setFont("helvetica", "bold");
  type(title, left, y, 24, green, "bold");
  y += title.length * 9 + 4;
  type(
    `Gerado em ${generatedAt.toLocaleDateString("pt-BR")}`,
    left,
    y,
    9,
    muted,
  );
  y += 9;
  doc.setFillColor(sand);
  doc.roundedRect(left, y, width, 40, 4, 4, "F");
  type("TOTAL REGISTRADO", left + 7, y + 10, 9, muted, "bold");
  type(money(stats.total), left + 7, y + 25, 26, green, "bold");
  type(
    `${trip.expenses.length} despesas | ${trip.people.length} pessoas`,
    right - 7,
    y + 33,
    9,
    muted,
    "normal",
    { align: "right" },
  );
  y += 50;
  if (stats.days)
    paragraph(
      `Média de ${money(stats.average)} por dia, no intervalo de ${stats.days} ${stats.days === 1 ? "dia" : "dias"} entre o primeiro e o último registro.`,
    );
  section("Onde foi o dinheiro", 35);
  const categories = Object.entries(stats.categories)
    .filter(([, v]) => v)
    .sort((a, b) => b[1] - a[1]);
  if (!categories.length) paragraph("Nenhuma despesa registrada.");
  categories.forEach(([category, amount]) => {
    ensure(19);
    type(category, left, y, 10, green, "bold");
    type(
      `${money(amount)}  |  ${Math.round((amount / stats.total) * 100)}%`,
      right,
      y,
      10,
      green,
      "normal",
      { align: "right" },
    );
    y += 4;
    doc.setFillColor("#E5ECE2");
    doc.roundedRect(left, y, width, 3, 1, 1, "F");
    doc.setFillColor("#647554");
    doc.rect(left, y, Math.max(0.5, (width * amount) / stats.total), 3, "F");
    y += 12;
  });
  y += 3;
  section("Quanto ficou para cada pessoa", 30);
  function peopleHeader() {
    doc.setFillColor(sand);
    doc.rect(left, y - 5, width, 9, "F");
    type("Pessoa", left + 3, y, 9, muted, "bold");
    type("Pagou", 114, y, 9, muted, "bold", { align: "right" });
    type("Sua parte", 151, y, 9, muted, "bold", { align: "right" });
    type("Saldo", right - 3, y, 9, muted, "bold", { align: "right" });
    y += 10;
  }
  peopleHeader();
  for (const person of stats.people) {
    const lines = wrap(person.name, 53, 9),
      height = Math.max(12, lines.length * 4.5 + 6);
    if (y + height > bottom) {
      doc.addPage();
      pageHeader();
      section("Por pessoa - continuação");
      peopleHeader();
    }
    type(lines, left + 3, y, 9, green, "bold");
    type(money(person.paid), 114, y, 9, green, "normal", { align: "right" });
    type(money(person.share), 151, y, 9, green, "normal", { align: "right" });
    type(
      `${person.balance > 0 ? "+" : ""}${money(person.balance)}`,
      right - 3,
      y,
      9,
      person.balance < 0 ? "#A64425" : green,
      "bold",
      { align: "right" },
    );
    y += height;
  }
  paragraph("Saldo positivo: tem a receber. Saldo negativo: precisa acertar.");
  section("Acertos sugeridos", 28);
  if (!stats.settlements.length) paragraph("Nenhum acerto pendente.");
  for (const s of stats.settlements) {
    const lines = wrap(
        `${s.from} paga ${money(s.amount)} para ${s.to}.`,
        width - 14,
        10,
      ),
      height = lines.length * 5 + 12;
    ensure(height);
    doc.setFillColor("#E5ECE2");
    doc.roundedRect(left, y - 5, width, height - 2, 3, 3, "F");
    type(lines, left + 7, y + 2, 10, green, "bold");
    y += height + 3;
  }
  paragraph(
    "Os acertos são calculados a partir das despesas. Transferências de quitação não são registradas neste relatório.",
  );
  y += 3;
  section("Despesas do caminho", 35);
  const byId = Object.fromEntries(trip.people.map((p) => [p.id, p.name]));
  const expenses = [...trip.expenses].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  if (!expenses.length)
    paragraph(
      "Adicione gastos na aba Na conta para preencher seu relatório.",
    );
  for (const e of expenses) {
    const heading = wrap(e.description, 123, 10);
    const detail = wrap(
      `${e.date.split("-").reverse().join("/")} | ${e.category} | Pago por ${byId[e.payer]}${e.installments > 1 ? ` | Parcelamento: ${installmentLabel(e.amount, e.installments)}` : ""}`,
      width,
      9,
    );
    const split = wrap(
      `Divisão: ${Object.entries(e.shares)
        .map(([id, amount]) => `${byId[id]} ${money(amount)}`)
        .join(" / ")}`,
      width,
      8,
    );
    const height =
      heading.length * 5 + detail.length * 4.5 + split.length * 4 + 13;
    ensure(height);
    type(heading, left, y, 10, green, "bold");
    type(money(e.amount), right, y, 10, green, "bold", { align: "right" });
    y += heading.length * 5 + 1;
    type(detail, left, y, 9, muted);
    y += detail.length * 4.5 + 1;
    type(split, left, y, 8, muted);
    y += split.length * 4 + 5;
    rule();
  }
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(line);
    doc.line(left, 283, right, 283);
    type("Rota Raiz | O caminho também é viagem", left, 289, 8, muted);
    type(`${p} / ${pages}`, right, 289, 8, muted, "normal", { align: "right" });
  }
  return doc;
}

export function downloadTripPdf(trip) {
  const doc = createTripPdf(trip);
  doc.save(tripPdfFilename(trip.name, trip.scope));
}
