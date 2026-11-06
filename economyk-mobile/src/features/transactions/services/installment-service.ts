import { db } from "@/db";
import { transactions } from "@/db/schema";
import { NewTransaction, Transaction } from "@/types/transaction";
import { and, eq, gte } from "drizzle-orm";
import { changeMonth } from "@/utils/month";

export async function createInstallments(
  data: NewTransaction,
  month: string,
): Promise<Transaction[]> {
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

  await db.insert(transactions).values(newTransactions);

  return newTransactions;
}

export async function updateInstallments(
  data: NewTransaction,
  editingTransaction: Transaction,
): Promise<Transaction[]> {
  const currentInstallmentNum = editingTransaction.installmentNumber || 1;
  const groupId = editingTransaction.installmentGroupId!;

  await db
    .delete(transactions)
    .where(
      and(
        eq(transactions.installmentGroupId, groupId),
        gte(transactions.month, editingTransaction.month),
      ),
    );

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

    await db.insert(transactions).values(normalTransaction);

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
    await db.insert(transactions).values(newTransactions);
  }

  return newTransactions;
}

export async function deleteInstallments(item: Transaction): Promise<void> {
  const groupId = item.installmentGroupId!;

  await db
    .delete(transactions)
    .where(
      and(
        eq(transactions.installmentGroupId, groupId),
        gte(transactions.month, item.month),
      ),
    );
}
