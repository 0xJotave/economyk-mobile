import type { Transaction } from "@/types/transaction";
import { changeMonth } from "./month";

export interface FinancialSummary {
  monthTransactions: Transaction[];
  income: number;
  savings: number;
  expenses: number;
  remainingAmount: number;
  monthlyResult: number;
  previousCarryover: number;
  totalAvailable: number;
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
  const previousMonth = changeMonth(month, -1);
  let previousRemainingAmount = 0;
  const summary: FinancialSummary = {
    monthTransactions: [],
    income: 0,
    savings: 0,
    expenses: 0,
    remainingAmount: 0,
    monthlyResult: 0,
    previousCarryover: 0,
    totalAvailable: 0,
    unconfirmedCount: 0,
    unconfirmedItems: [],
  };

  for (const transaction of transactions) {
    if (transaction.month === previousMonth) {
      // A sobra vem apenas de M-1, sem transportar saldos de meses anteriores.
      previousRemainingAmount +=
        transaction.type === "income" ? transaction.price : -transaction.price;
    }

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
  summary.monthlyResult = summary.income - summary.expenses;
  summary.previousCarryover = Math.max(0, previousRemainingAmount);
  summary.totalAvailable = summary.monthlyResult + summary.previousCarryover;

  return summary;
}
