export async function convertToUAH(
  amount: number,
  currency: string
): Promise<number> {
  if (currency === "UAH") return amount;

  const rateKey = `fx_rate_${currency}`;
  const cached = localStorage.getItem(rateKey);
  if (cached) return amount * parseFloat(cached);

  try {
    const response = await fetch(
      `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${currency}&json`
    );

    const data = await response.json();

    const rate = data?.[0]?.rate;
    if (!rate) throw new Error("Немає курсу");

    localStorage.setItem(rateKey, rate.toString());
    return amount * rate;
  } catch (err) {
    console.error("❌ Помилка отримання курсу НБУ:", err);
    return amount; // fallback: повертаємо суму без конвертації
  }
}
