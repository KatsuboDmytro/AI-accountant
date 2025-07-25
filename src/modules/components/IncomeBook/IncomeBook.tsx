import React from "react";
import "./IncomeBook.css";
import { useTransactions } from "../../../hooks/useTransactions";

interface Props {
  isVATpayer: boolean;
}

export const IncomeBook: React.FC<Props> = ({ isVATpayer }) => {
  const transactions = useTransactions();

  // Загальний дохід
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.uahAmount, 0);

  // Загальні витрати
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.uahAmount, 0);

  const profit = totalIncome - totalExpense;

  const isAutoVATpayer = totalIncome >= 1_000_000;
  const showVAT = isVATpayer || isAutoVATpayer;

  // Податки
  const singleTax = profit * 0.05;
  const monthlyPensionTax = 1500 / 3;
  const vatTax = showVAT ? profit * 0.2 : 0;
  const totalTax = singleTax + monthlyPensionTax + vatTax;

  // Чистий прибуток після податків
  const netProfit = profit - totalTax;

  return (
    <div className="income-book">
      <h2 className="income-book__title">Книга доходів</h2>

      <div className="income-book__section">
        <h3>Поточний місяць</h3>
        <p>
          Доходи: <span className="money">{totalIncome.toFixed(2)} ₴</span>
        </p>
        <p>
          Витрати: <span className="tax">{totalExpense.toFixed(2)} ₴</span>
        </p>
        <p>
          ЄП (5%): <span className="tax">{singleTax.toFixed(2)} ₴</span>
        </p>
        <p>
          ЄСВ (щомісячна частка з 1500 грн/квартал):{" "}
          <span className="tax">{monthlyPensionTax.toFixed(2)} ₴</span>
        </p>
        {Number(totalIncome.toFixed(2)) >= 1000000 && (
          <p>
            ПДВ (20%): <span className="tax">{vatTax.toFixed(2)} ₴</span>
          </p>
        )}
        <p>
          Усього податків: <span className="tax">{totalTax.toFixed(2)} ₴</span>
        </p>
      </div>

      <div className="income-book__section">
        <p>
          Чистий прибуток:{" "}
          <span className="money">{netProfit.toFixed(2)} ₴</span>
        </p>
      </div>
    </div>
  );
};
