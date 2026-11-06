import type { Transaction } from "@/types/transaction";

export interface FinancialSummary {
  monthTransactions: Transaction[];
  income: number;
  savings: number;
  expenses: number;
  remainingAmount: number;
  unconfirmedCount: number;
  unconfirmedItems: Array<{
    id: number;
    name: string;
    price: number;
  }>;
}

export function calculateFinancialSummary(
  transactions: Transaction[],
  month: string,
): FinancialSummary {
  const summary: FinancialSummary = {
    monthTransactions: [],
    income: 0,
    savings: 0,
    expenses: 0,
    remainingAmount: 0,
    unconfirmedCount: 0,
    unconfirmedItems: [],
  };

  for (const transaction of transactions) {
    if (transaction.month !== month) continue;

    summary.monthTransactions.push(transaction);

    if (transaction.type === "income") {
      summary.income += transaction.price;
    } else if (transaction.type === "saving") {
      summary.savings += transaction.price;
    } else if (transaction.type === "expense") {
      summary.expenses += transaction.price;
    }

    if (!transaction.isConfirmed) {
      summary.unconfirmedCount++;

      summary.unconfirmedItems.push({
        id: transaction.id,
        name: transaction.name,
        price: transaction.price,
      });
    }
  }

  summary.remainingAmount = summary.income - summary.savings - summary.expenses;

  return summary;
}
