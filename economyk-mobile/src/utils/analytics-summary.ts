import type { Transaction } from "@/types/transaction";

interface AnalyticsSummary {
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  sortedCategories: Array<[string, number]>;
}

export function calculateAnalyticsSummary(
  transactions: Transaction[],
  month: string,
): AnalyticsSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalSavings = 0;

  const expensesByCategory = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.month !== month) continue;

    if (transaction.type === "income") {
      totalIncome += transaction.price;
      continue;
    }

    if (transaction.type === "saving") {
      totalSavings += transaction.price;
      continue;
    }

    if (transaction.type === "expense") {
      totalExpense += transaction.price;

      expensesByCategory.set(
        transaction.category,
        (expensesByCategory.get(transaction.category) ?? 0) + transaction.price,
      );
    }
  }

  const sortedCategories = Array.from(expensesByCategory.entries()).sort(
    (a, b) => b[1] - a[1],
  );

  return {
    totalIncome,
    totalExpense,
    totalSavings,
    sortedCategories,
  };
}
