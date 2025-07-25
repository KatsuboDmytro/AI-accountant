export interface Transaction {
  id: string;
  type: "income" | "expense";
  originalAmount: number;
  currency: string;
  uahAmount: number;
  date: string; // YYYY-MM-DD
  description: string;
}

export function getTransactions(): Transaction[] {
  return JSON.parse(localStorage.getItem("transactions") || "[]");
}

export function saveTransactions(transactions: Transaction[]) {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function notifyTransactionChange() {
  window.dispatchEvent(new Event("customStorageChange"));
}

export function addTransaction(t: Transaction) {
  const current = getTransactions();
  saveTransactions([...current, t]);
  notifyTransactionChange();
}

export function removeTransaction(id: string) {
  const current = getTransactions();
  saveTransactions(current.filter((t) => t.id !== id));
  notifyTransactionChange();
}

export function removeTransactionsByTypeAndDate(
  type: "income" | "expense",
  date: string
): Transaction[] {
  const all = getTransactions();
  const remaining = all.filter((t) => !(t.type === type && t.date === date));
  const removed = all.filter((t) => t.type === type && t.date === date);
  localStorage.setItem("transactions", JSON.stringify(remaining));
  notifyTransactionChange();
  return removed;
}
