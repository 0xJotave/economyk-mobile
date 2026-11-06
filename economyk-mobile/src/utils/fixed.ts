import { Transaction } from "@/types/transaction";

type FixedGroupClosure = {
  fixedGroupId: number;
  fromMonth: string;
};

export const calculateFixedTransactions = (
  transactions: Transaction[],
  month: string,
  closures: FixedGroupClosure[] = [],
) => {
  const latestFixedByGroup = new Map<number, Transaction>();

  for (const transaction of transactions) {
    if (
      transaction.month >= month ||
      transaction.isFixed !== true ||
      transaction.fixedGroupId == null
    ) {
      continue;
    }

    const latest = latestFixedByGroup.get(transaction.fixedGroupId);

    if (!latest || transaction.month > latest.month) {
      latestFixedByGroup.set(transaction.fixedGroupId, transaction);
    }
  }

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

  const toCopy = Array.from(latestFixedByGroup.values()).filter((transaction) => {
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
