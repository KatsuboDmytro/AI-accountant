import { v4 as uuidv4 } from "uuid";
import { convertToUAH } from "./currencyUtils";
import {
  addTransaction,
  removeTransaction,
  getTransactions,
  removeTransactionsByTypeAndDate,
} from "./transactions";
import * as chrono from "chrono-node";

// Ключові слова
const expenseKeywords = [
  "витрат",
  "витрата",
  "витрати",
  "витратив",
  "заплатив",
  "списано",
  "покупка",
  "було витрат",
  "оплата",
  "переказав",
  "знято",
  "мінус",
  "віддав",
  "витрачено",
];

const incomeKeywords = [
  "дохід",
  "прибуток",
  "заробив",
  "отримав",
  "поступлення",
  "зараховано",
  "поповнення",
  "прибуло",
  "додано",
  "переказ",
  "надходження",
];

const cancelKeywords = [
  "скасуй",
  "відміни",
  "скасувати",
  "помилився",
  "видали",
  "відмінити",
  "відмінено",
  "скасуй усі",
  "скасуй усе",
  "видалити всі",
  "видалити все",
];

const currencyMap: Record<string, string> = {
  usd: "USD",
  $: "USD",
  долар: "USD",
  доларів: "USD",
  eur: "EUR",
  євро: "EUR",
  uah: "UAH",
  грн: "UAH",
  гривень: "UAH",
  гривня: "UAH",
};

export async function handleFinanceMessage(text: string): Promise<string> {
  const lower = text.toLowerCase();
  const date = chrono.parseDate(text) || new Date();
  const dateStr = date.toISOString().split("T")[0];

  // 1. Якщо це скасування всіх транзакцій певного типу
  if (lower.includes("видалити всі")) {
    const type: "income" | "expense" = lower.includes("дохід")
      ? "income"
      : "expense";
    const removed = removeTransactionsByTypeAndDate(type, dateStr);
    return removed.length
      ? `Видалено всі транзакції типу "${type}" за ${dateStr}.`
      : `Немає транзакцій типу "${type}" за ${dateStr}.`;
  }

  // 2. Якщо це скасування останньої транзакції
  if (
    cancelKeywords.some(
      (k) =>
        ["скасуй усі", "скасуй усе", "видалити всі", "видалити все"].includes(
          k
        ) && lower.includes(k)
    )
  ) {
    const removed = removeTransactionsByTypeAndDate("income", dateStr).concat(
      removeTransactionsByTypeAndDate("expense", dateStr)
    );
    return removed.length
      ? `Скасовано всі транзакції за ${dateStr}.`
      : `Немає транзакцій за ${dateStr}.`;
  }

  // 3. Якщо це скасування останньої транзакції
  if (cancelKeywords.some((k) => lower.includes(k))) {
    const all = getTransactions();
    const last = all[all.length - 1];
    if (last) {
      removeTransaction(last.id);
      return `Скасовано останню транзакцію: ${last.description}`;
    }
    return "Не знайшов що скасувати.";
  }

  // 3. Отримуємо суму та валюту
  const amountRegex =
    /(\d+[.,]?\d*)\s*(usd|eur|uah|доларів?|$|долар|євро|грн|гривень|гривня)/i;
  const match = text.match(amountRegex);
  if (!match) return "Не вдалося визначити суму та валюту.";

  const rawAmount = match[1].replace(",", ".");
  const amount = parseFloat(rawAmount);
  const rawCurrency = match[2].toLowerCase();
  const currency = currencyMap[rawCurrency];
  if (!currency) return "Не вдалося розпізнати валюту.";

  const uah =
    currency === "UAH" ? amount : await convertToUAH(amount, currency);

  // 4. Визначаємо тип
  const isIncome = incomeKeywords.some((k) => lower.includes(k));
  const isExpense = expenseKeywords.some((k) => lower.includes(k));

  let type: "income" | "expense";
  if (isIncome && !isExpense) type = "income";
  else if (isExpense && !isIncome) type = "expense";
  else {
    // fallback
    type =
      lower.includes("-") || lower.includes("витрат") ? "expense" : "income";
  }

  const description = text;
  const id = uuidv4();

  const transaction = {
    id,
    type,
    originalAmount: amount,
    currency,
    uahAmount: uah,
    date: dateStr,
    description,
  };

  addTransaction(transaction);

  return `${
    type === "expense" ? "Витрату" : "Дохід"
  } ${amount} ${currency} (${uah.toFixed(2)} грн) додано на ${dateStr}.`;
}
