import { useEffect, useState } from "react";
import { getTransactions, type Transaction } from "../utils/transactions";

export function useTransactions(): Transaction[] {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const load = () => setTransactions(getTransactions());

    window.addEventListener("customStorageChange", load);
    load();

    return () => window.removeEventListener("customStorageChange", load);
  }, []);

  return transactions;
}
