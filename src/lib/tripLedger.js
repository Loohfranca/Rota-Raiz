export const CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Passagem de avião",
  "Hospedagem",
  "Passeios",
  "Compras",
  "Outros",
];
export const money = (cents) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export function parseMoney(value) {
  const s = String(value).trim();
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(s))
    throw new Error("Use um valor como 120,50, sem separador de milhar.");
  const cents = Math.round(Number(s.replace(",", ".")) * 100);
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 100000000)
    throw new Error("Informe um valor entre R$ 0,01 e R$ 1.000.000.");
  return cents;
}
// The total is booked once; installments describe payment, not extra expenses.
export function installmentLabel(amount, installments = 1) {
  if (!Number.isSafeInteger(installments) || installments < 1 || installments > 60 || installments > amount)
    throw new Error("Informe de 1 a 60 parcelas, de pelo menos R$ 0,01 cada.");
  if (installments === 1) return "À vista";
  const base = Math.floor(amount / installments), remainder = amount % installments;
  return remainder
    ? `${remainder} × ${money(base + 1)} + ${installments - remainder} × ${money(base)}`
    : `${installments} × ${money(base)}`;
}
export function splitAmount(amount, ids) {
  if (!ids.length)
    throw new Error("Escolha pelo menos uma pessoa para dividir.");
  const base = Math.floor(amount / ids.length),
    remainder = amount % ids.length;
  return Object.fromEntries(
    ids.map((id, index) => [id, base + (index < remainder ? 1 : 0)]),
  );
}
export function summarize(trip) {
  const people = trip.people.map((p) => ({
    ...p,
    paid: 0,
    share: 0,
    balance: 0,
  }));
  const byId = Object.fromEntries(people.map((p) => [p.id, p]));
  const categories = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  let total = 0;
  for (const expense of trip.expenses) {
    total += expense.amount;
    categories[expense.category] += expense.amount;
    byId[expense.payer].paid += expense.amount;
    for (const [id, amount] of Object.entries(expense.shares))
      byId[id].share += amount;
  }
  people.forEach((p) => {
    p.balance = p.paid - p.share;
  });
  const creditors = people.filter((p) => p.balance > 0).map((p) => ({ ...p }));
  const debtors = people
    .filter((p) => p.balance < 0)
    .map((p) => ({ ...p, balance: -p.balance }));
  const settlements = [];
  for (const debtor of debtors)
    for (const creditor of creditors) {
      const amount = Math.min(debtor.balance, creditor.balance);
      if (amount) {
        settlements.push({ from: debtor.name, to: creditor.name, amount });
        debtor.balance -= amount;
        creditor.balance -= amount;
      }
    }
  const dates = trip.expenses.map((e) => e.date).sort();
  const days = dates.length
    ? Math.round((Date.parse(dates.at(-1)) - Date.parse(dates[0])) / 86400000) +
      1
    : 0;
  return {
    total,
    categories,
    people,
    settlements,
    days,
    average: days ? Math.round(total / days) : 0,
  };
}
export function validateTrips(data) {
  if (!Array.isArray(data) || data.length > 100)
    throw new Error("Arquivo de viagens inválido.");
  const used = new Set();
  for (const t of data) {
    if (
      !t ||
      typeof t.id !== "string" ||
      used.has(t.id) ||
      typeof t.name !== "string" ||
      !t.name.trim() ||
      t.name.length > 100 ||
      !Array.isArray(t.people) ||
      !t.people.length ||
      t.people.length > 50 ||
      !Array.isArray(t.expenses) ||
      t.expenses.length > 10000
    )
      throw new Error("Viagem inválida no arquivo.");
    used.add(t.id);
    const ids = new Set(t.people.map((p) => p.id));
    if (
      ids.size !== t.people.length ||
      t.people.some(
        (p) =>
          typeof p.id !== "string" ||
          typeof p.name !== "string" ||
          !p.name.trim() ||
          p.name.length > 60,
      )
    )
      throw new Error("Participantes inválidos.");
    const expenseIds = new Set();
    for (const e of t.expenses) {
      if (
        !e ||
        typeof e.id !== "string" ||
        expenseIds.has(e.id) ||
        typeof e.description !== "string" ||
        !e.description.trim() ||
        e.description.length > 160 ||
        !CATEGORIES.includes(e.category) ||
        !Number.isSafeInteger(e.amount) ||
        e.amount <= 0 ||
        e.amount > 100000000 ||
        !ids.has(e.payer) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(e.date) ||
        !Number.isFinite(Date.parse(e.date)) ||
        new Date(e.date).toISOString().slice(0, 10) !== e.date ||
        !e.shares ||
        !Object.keys(e.shares).length ||
        Object.entries(e.shares).some(
          ([id, amount]) =>
            !ids.has(id) || !Number.isSafeInteger(amount) || amount < 0,
        ) ||
        Object.values(e.shares).reduce((a, b) => a + b, 0) !== e.amount
      )
        throw new Error("Despesa inválida no arquivo.");
      installmentLabel(e.amount, e.installments);
      expenseIds.add(e.id);
    }
  }
  return data;
}
export function downloadJson(name, data) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
