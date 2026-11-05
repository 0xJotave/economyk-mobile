import { Transaction } from "@/types/transaction";

interface BalanceResult {
  remainingAmount: number;
  unconfirmedCount: number;
  unconfirmedItems: Array<{ id: number; name: string; price: number }>;
}

export default function calculateBalance(
  transactions: Transaction[],
  month: string,
): BalanceResult {
  const income = transactions
    .filter((t) => t.type === "income" && t.month === month)
    .reduce((sum, t) => sum + t.price, 0);

  const savings = transactions
    .filter((t) => t.type === "saving" && t.month === month)
    .reduce((sum, t) => sum + t.price, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense" && t.month === month)
    .reduce((sum, t) => sum + t.price, 0);

  const unconfirmedItems = transactions.filter(
    (t) => t.isConfirmed === false && t.month === month,
  );

  const unconfirmedItemsSimplified = unconfirmedItems.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
  }));

  const remainingAmount = income - savings - expenses;
  return {
    remainingAmount,
    unconfirmedCount: unconfirmedItems.length,
    unconfirmedItems: unconfirmedItemsSimplified,
  };
}
