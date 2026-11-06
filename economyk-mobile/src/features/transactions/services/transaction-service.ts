import { db } from "@/db";
import { transactions } from "@/db/schema";
import { NewTransaction, Transaction } from "@/types/transaction";
import { eq } from "drizzle-orm";

export type TransactionExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function createTransaction(
  data: NewTransaction,
  month: string,
  executor: typeof db | TransactionExecutor = db,
): Transaction {
  const id = Date.now();

  const newTransaction: Transaction = {
    ...data,
    id,
    month,
    fixedGroupId: data.isFixed ? id : undefined,
  };

  executor.insert(transactions).values(newTransaction).run();

  return newTransaction;
}

export function updateTransaction(
  data: NewTransaction,
  editingTransaction: Transaction,
  executor: typeof db | TransactionExecutor = db,
): Transaction {
  const updatedTransaction: Transaction = {
    ...data,
    id: editingTransaction.id,
    month: editingTransaction.month,
  };

  executor
    .update(transactions)
    .set(data)
    .where(eq(transactions.id, editingTransaction.id)).run();

  return updatedTransaction;
}

export function deleteTransaction(
  id: number,
  executor: typeof db | TransactionExecutor = db,
): void {
  executor.delete(transactions).where(eq(transactions.id, id)).run();
}
