import type { Transaction } from "@/types/transaction";
import { calculateFinancialSummary } from "./financial-summary";

export default function calculateBalance(
  transactions: Transaction[],
  month: string,
) {
  const summary = calculateFinancialSummary(transactions, month);

  return {
    remainingAmount: summary.remainingAmount,
    monthlyResult: summary.monthlyResult,
    previousCarryover: summary.previousCarryover,
    totalAvailable: summary.totalAvailable,
    unconfirmedCount: summary.unconfirmedCount,
    unconfirmedItems: summary.unconfirmedItems,
  };
}
