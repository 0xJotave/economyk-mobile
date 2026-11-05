import { Transaction } from "@/types/transaction";
import { changeMonth } from "./month";

type FixedGroupClosure = {
  fixedGroupId: number;
  fromMonth: string;
};

export const calculateFixedTransactions = (
  transactions: Transaction[],
  month: string,
  closures: FixedGroupClosure[] = [],
) => {
  const previousMonth = changeMonth(month, -1);

  const previousFixedItems = transactions.filter(
    (transaction) =>
      transaction.month === previousMonth &&
      transaction.isFixed === true &&
      transaction.fixedGroupId != null,
  );

  const currentGroupIds = new Set(
    transactions
      .filter((transaction) => transaction.month === month)
      .map((transaction) => transaction.fixedGroupId)
      .filter((id): id is number => id != null),
  );

  const closedGroupIds = new Set(
    closures
      .filter((closure) => month >= closure.fromMonth)
      .map((closure) => closure.fixedGroupId),
  );

  const toCopy = previousFixedItems.filter((transaction) => {
    const groupId = transaction.fixedGroupId!;

    return !currentGroupIds.has(groupId) && !closedGroupIds.has(groupId);
  });

  return toCopy.map((transaction) => ({
    ...transaction,
    id: Date.now() + Math.floor(Math.random() * 100000),
    month,
    isConfirmed: false,
  }));
};
