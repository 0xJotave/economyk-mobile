import { db } from "@/db";
import { fixedGroupClosures, transactions } from "@/db/schema";
import { NewTransaction, Transaction } from "@/types/transaction";
import { and, eq, gte, or } from "drizzle-orm";
import { calculateFixedTransactions } from "@/utils/fixed";
import type { TransactionExecutor } from "./transaction-service";

export function applyFixedTransactions(
  _currentTransactions: Transaction[],
  targetMonth: string,
  executor: typeof db | TransactionExecutor = db,
): Transaction[] {
  return executor.transaction((tx) => {
    const closures = tx.select().from(fixedGroupClosures).all();
    const persisted = tx.select().from(transactions).all() as Transaction[];
    const candidates = calculateFixedTransactions(persisted, targetMonth, closures);
    const groups = new Set<number>();
    const missing = candidates.filter((item) => {
      const groupId = item.fixedGroupId!;
      if (groups.has(groupId)) return false;
      groups.add(groupId);
      return true;
    });

    if (missing.length > 0) tx.insert(transactions).values(missing).run();
    return missing;
  }, { behavior: "immediate" });
}

function closeFixedGroup(
  groupId: number,
  fromMonth: string,
  executor: typeof db | TransactionExecutor = db,
): void {
  return executor.transaction((tx) => {
    tx.delete(fixedGroupClosures)
      .where(eq(fixedGroupClosures.fixedGroupId, groupId)).run();

    tx.insert(fixedGroupClosures).values({
      fixedGroupId: groupId,
      fromMonth,
    }).run();
  });
}

function reopenFixedGroup(
  groupId: number,
  executor: typeof db | TransactionExecutor,
): void {
  executor
    .delete(fixedGroupClosures)
    .where(eq(fixedGroupClosures.fixedGroupId, groupId)).run();
}

export function updateFixedTransaction(
  data: NewTransaction,
  editingTransaction: Transaction,
  executor: typeof db | TransactionExecutor = db,
): Transaction {
  return executor.transaction((tx) => {
    const groupId = editingTransaction.fixedGroupId ?? editingTransaction.id;

    tx.delete(transactions)
      .where(
        and(
          or(
            eq(transactions.fixedGroupId, groupId),
            eq(transactions.id, groupId),
          ),
          gte(transactions.month, editingTransaction.month),
        ),
      )
      .run();

    if (data.isFixed) {
      reopenFixedGroup(groupId, tx);
    } else {
      closeFixedGroup(groupId, editingTransaction.month, tx);
    }

    const updatedTransaction: Transaction = {
      ...data,
      id: editingTransaction.id,
      month: editingTransaction.month,
      fixedGroupId: data.isFixed ? groupId : undefined,
    };

    tx.insert(transactions).values(updatedTransaction).run();

    return updatedTransaction;
  });
}

export function deleteFixedTransaction(
  item: Transaction,
  executor: typeof db | TransactionExecutor = db,
): void {
  return executor.transaction((tx) => {
    const groupId = item.fixedGroupId ?? item.id;

    closeFixedGroup(groupId, item.month, tx);

    tx.delete(transactions)
      .where(
        and(
          or(
            eq(transactions.fixedGroupId, groupId),
            eq(transactions.id, groupId),
          ),
          gte(transactions.month, item.month),
        ),
      )
      .run();
  });
}
