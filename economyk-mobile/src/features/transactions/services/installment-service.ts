import { db } from "@/db";
import type { TransactionExecutor } from "./transaction-service";
import { transactions } from "@/db/schema";
import { NewTransaction, Transaction } from "@/types/transaction";
import { and, eq, gte } from "drizzle-orm";
import { changeMonth } from "@/utils/month";

export function createInstallments(
  data: NewTransaction,
  month: string,
  executor: typeof db | TransactionExecutor = db,
): Transaction[] {
  const total = data.totalInstallments!;
  const groupId = Date.now();

  const newTransactions: Transaction[] = [];

  for (let i = 0; i < total; i++) {
    let targetMonth = month;

    for (let step = 0; step < i; step++) {
      targetMonth = changeMonth(targetMonth, 1);
    }

    newTransactions.push({
      ...data,
      id: groupId + i,
      month: targetMonth,
      installmentNumber: i + 1,
      totalInstallments: total,
      installmentGroupId: groupId,
      fixedGroupId: undefined,
    });
  }

  executor.insert(transactions).values(newTransactions).run();

  return newTransactions;
}

export function updateInstallments(
  data: NewTransaction,
  editingTransaction: Transaction,
  executor: typeof db | TransactionExecutor = db,
): Transaction[] {
  const currentInstallmentNum = editingTransaction.installmentNumber || 1;
  const groupId = editingTransaction.installmentGroupId!;

  if (
    data.totalInstallments != null &&
    data.totalInstallments > 1 &&
    data.totalInstallments < currentInstallmentNum
  ) {
    throw new Error(`O total de parcelas deve ser pelo menos ${currentInstallmentNum}.`);
  }

  // O driver Expo SQLite exige callback síncrono para garantir o rollback.
  return executor.transaction((tx) => {
    tx.delete(transactions)
      .where(
        and(
          eq(transactions.installmentGroupId, groupId),
          gte(transactions.month, editingTransaction.month),
        ),
      )
      .run();

    if (!data.totalInstallments || data.totalInstallments <= 1) {
      const normalTransaction: Transaction = {
        ...data,
        id: editingTransaction.id,
        month: editingTransaction.month,
        installmentNumber: undefined,
        totalInstallments: undefined,
        installmentGroupId: undefined,
        fixedGroupId: data.isFixed ? editingTransaction.id : undefined,
      };

      tx.insert(transactions).values(normalTransaction).run();

      return [normalTransaction];
    }

    const total = data.totalInstallments;
    const newTransactions: Transaction[] = [];

    for (let i = currentInstallmentNum; i <= total; i++) {
      const stepOffset = i - currentInstallmentNum;
      let targetMonth = editingTransaction.month;

      for (let step = 0; step < stepOffset; step++) {
        targetMonth = changeMonth(targetMonth, 1);
      }

      newTransactions.push({
        ...data,
        id: groupId + i - 1,
        month: targetMonth,
        installmentNumber: i,
        totalInstallments: total,
        installmentGroupId: groupId,
        fixedGroupId: undefined,
      });
    }

    if (newTransactions.length > 0) {
      tx.insert(transactions).values(newTransactions).run();
    }

    return newTransactions;
  });
}

export function deleteInstallments(
  item: Transaction,
  executor: typeof db | TransactionExecutor = db,
): void {
  const groupId = item.installmentGroupId!;

  executor
    .delete(transactions)
    .where(
      and(
        eq(transactions.installmentGroupId, groupId),
        gte(transactions.month, item.month),
      ),
    )
    .run();
}
