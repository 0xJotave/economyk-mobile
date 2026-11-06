import { db } from "@/db";
import { transactions } from "@/db/schema";
import type { TransactionExecutor } from "./transaction-service";
import { NewTransaction, Transaction } from "@/types/transaction";
import { changeMonth } from "@/utils/month";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "./transaction-service";
import {
  createInstallments,
  updateInstallments,
  deleteInstallments,
} from "./installment-service";
import {
  applyFixedTransactions,
  updateFixedTransaction,
  deleteFixedTransaction,
} from "./fixed-transaction-service";

function saveTransactionInTransaction(
  data: NewTransaction,
  editingTransaction: Transaction | null,
  month: string,
  currentTransactions: Transaction[],
  executor: TransactionExecutor,
): Transaction[] {
  if (!editingTransaction) {
    if (data.totalInstallments && data.totalInstallments > 1) {
      const newTransactions = createInstallments(data, month, executor);
      return [...currentTransactions, ...newTransactions];
    }

    const newTransaction = createTransaction(data, month, executor);
    const updatedList = [...currentTransactions, newTransaction];

    if (newTransaction.isFixed) {
      const nextMonth = changeMonth(month, 1);
      const propagated = applyFixedTransactions(updatedList, nextMonth, executor);

      updatedList.push(...propagated);
    }

    return updatedList;
  }

  if (editingTransaction.installmentGroupId != null) {
    const newTransactions = updateInstallments(data, editingTransaction, executor);

    const remainingTransactions = currentTransactions.filter(
      (transaction) =>
        !(
          transaction.installmentGroupId ===
            editingTransaction.installmentGroupId &&
          transaction.month >= editingTransaction.month
        ),
    );

    const updatedList = [...remainingTransactions, ...newTransactions];

    if (data.isFixed) {
      const nextMonth = changeMonth(editingTransaction.month, 1);
      const propagated = applyFixedTransactions(updatedList, nextMonth, executor);

      updatedList.push(...propagated);
    }

    return updatedList;
  }

  if (
    data.isFixed ||
    editingTransaction.isFixed ||
    editingTransaction.fixedGroupId != null
  ) {
    const updatedTransaction = updateFixedTransaction(
      data,
      editingTransaction,
      executor,
    );

    const groupId = editingTransaction.fixedGroupId ?? editingTransaction.id;

    const remainingTransactions = currentTransactions.filter(
      (transaction) =>
        !(
          (transaction.fixedGroupId === groupId ||
            transaction.id === editingTransaction.id) &&
          transaction.month >= editingTransaction.month
        ),
    );

    if (data.totalInstallments && data.totalInstallments > 1) {
      deleteTransaction(updatedTransaction.id, executor);

      const newTransactions = createInstallments(
        data,
        editingTransaction.month,
        executor,
      );

      return [...remainingTransactions, ...newTransactions];
    }

    const updatedList = [...remainingTransactions, updatedTransaction];

    if (data.isFixed) {
      const nextMonth = changeMonth(editingTransaction.month, 1);
      const propagated = applyFixedTransactions(updatedList, nextMonth, executor);

      updatedList.push(...propagated);
    }

    return updatedList;
  }

  if (data.totalInstallments && data.totalInstallments > 1) {
    deleteTransaction(editingTransaction.id, executor);

    const newTransactions = createInstallments(
      data,
      editingTransaction.month,
      executor,
    );

    return [
      ...currentTransactions.filter(
        (transaction) => transaction.id !== editingTransaction.id,
      ),
      ...newTransactions,
    ];
  }

  const updatedTransaction = updateTransaction(data, editingTransaction, executor);

  return currentTransactions.map((transaction) =>
    transaction.id === editingTransaction.id ? updatedTransaction : transaction,
  );
}

function removeTransactionInTransaction(
  itemToRemove: Transaction,
  currentTransactions: Transaction[],
  executor: TransactionExecutor,
): Transaction[] {
  if (itemToRemove.installmentGroupId != null) {
    deleteInstallments(itemToRemove, executor);

    return currentTransactions.filter(
      (transaction) =>
        !(
          transaction.installmentGroupId === itemToRemove.installmentGroupId &&
          transaction.month >= itemToRemove.month
        ),
    );
  }

  if (itemToRemove.isFixed || itemToRemove.fixedGroupId != null) {
    deleteFixedTransaction(itemToRemove, executor);

    const groupId = itemToRemove.fixedGroupId ?? itemToRemove.id;

    return currentTransactions.filter(
      (transaction) =>
        !(
          (transaction.fixedGroupId === groupId ||
            transaction.id === groupId) &&
          transaction.month >= itemToRemove.month
        ),
    );
  }

  deleteTransaction(itemToRemove.id, executor);

  return currentTransactions.filter(
    (transaction) => transaction.id !== itemToRemove.id,
  );
}

export async function saveTransaction(
  data: NewTransaction,
  editingTransaction: Transaction | null,
  month: string,
  _currentTransactions: Transaction[],
): Promise<Transaction[]> {
  return db.transaction((tx) => saveTransactionInTransaction(
    data,
    editingTransaction,
    month,
    tx.select().from(transactions).all() as Transaction[],
    tx,
  ));
}

export async function removeTransaction(
  itemToRemove: Transaction,
  _currentTransactions: Transaction[],
): Promise<Transaction[]> {
  return db.transaction((tx) => removeTransactionInTransaction(
    itemToRemove,
    tx.select().from(transactions).all() as Transaction[],
    tx,
  ));
}
