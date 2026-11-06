import { db } from "@/db";
import { fixedGroupClosures, transactions } from "@/db/schema";
import { NewTransaction, Transaction } from "@/types/transaction";
import { and, eq, gte, or } from "drizzle-orm";
import { calculateFixedTransactions } from "@/utils/fixed";
import { changeMonth } from "@/utils/month";

export async function applyFixedTransactions(
  currentTransactions: Transaction[],
  targetMonth: string,
): Promise<Transaction[]> {
  const closures = await db.select().from(fixedGroupClosures);

  const fixedTransactions = calculateFixedTransactions(
    currentTransactions,
    targetMonth,
    closures,
  );

  if (fixedTransactions.length === 0) {
    return [];
  }

  await db.insert(transactions).values(fixedTransactions);

  return fixedTransactions;
}

async function closeFixedGroup(
  groupId: number,
  fromMonth: string,
): Promise<void> {
  await db
    .delete(fixedGroupClosures)
    .where(eq(fixedGroupClosures.fixedGroupId, groupId));

  await db.insert(fixedGroupClosures).values({
    fixedGroupId: groupId,
    fromMonth,
  });
}

async function reopenFixedGroup(groupId: number): Promise<void> {
  await db
    .delete(fixedGroupClosures)
    .where(eq(fixedGroupClosures.fixedGroupId, groupId));
}

export async function updateFixedTransaction(
  data: NewTransaction,
  editingTransaction: Transaction,
): Promise<Transaction> {
  const groupId = editingTransaction.fixedGroupId ?? editingTransaction.id;

  await db
    .delete(transactions)
    .where(
      and(
        or(
          eq(transactions.fixedGroupId, groupId),
          eq(transactions.id, groupId),
        ),
        gte(transactions.month, editingTransaction.month),
      ),
    );

  if (data.isFixed) {
    await reopenFixedGroup(groupId);
  } else {
    await closeFixedGroup(groupId, editingTransaction.month);
  }

  const updatedTransaction: Transaction = {
    ...data,
    id: editingTransaction.id,
    month: editingTransaction.month,
    fixedGroupId: data.isFixed ? groupId : undefined,
  };

  await db.insert(transactions).values(updatedTransaction);

  return updatedTransaction;
}

export async function deleteFixedTransaction(item: Transaction): Promise<void> {
  const groupId = item.fixedGroupId ?? item.id;

  await closeFixedGroup(groupId, item.month);

  await db
    .delete(transactions)
    .where(
      and(
        or(
          eq(transactions.fixedGroupId, groupId),
          eq(transactions.id, groupId),
        ),
        gte(transactions.month, item.month),
      ),
    );
}
