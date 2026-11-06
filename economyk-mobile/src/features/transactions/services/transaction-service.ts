import { db } from "@/db";
import { transactions } from "@/db/schema";
import { NewTransaction, Transaction } from "@/types/transaction";
import { eq } from "drizzle-orm";

export async function createTransaction(
  data: NewTransaction,
  month: string,
): Promise<Transaction> {
  const id = Date.now();

  const newTransaction: Transaction = {
    ...data,
    id,
    month,
    fixedGroupId: data.isFixed ? id : undefined,
  };

  await db.insert(transactions).values(newTransaction);

  return newTransaction;
}

export async function updateTransaction(
  data: NewTransaction,
  editingTransaction: Transaction,
): Promise<Transaction> {
  const updatedTransaction: Transaction = {
    ...data,
    id: editingTransaction.id,
    month: editingTransaction.month,
  };

  await db
    .update(transactions)
    .set(data)
    .where(eq(transactions.id, editingTransaction.id));

  return updatedTransaction;
}

export async function deleteTransaction(id: number): Promise<void> {
  await db.delete(transactions).where(eq(transactions.id, id));
}
