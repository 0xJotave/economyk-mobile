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

export async function saveTransaction(
  data: NewTransaction,
  editingTransaction: Transaction | null,
  month: string,
  currentTransactions: Transaction[],
): Promise<Transaction[]> {
  if (!editingTransaction) {
    if (data.totalInstallments && data.totalInstallments > 1) {
      const newTransactions = await createInstallments(data, month);
      return [...currentTransactions, ...newTransactions];
    }

    const newTransaction = await createTransaction(data, month);
    const updatedList = [...currentTransactions, newTransaction];

    if (newTransaction.isFixed) {
      const nextMonth = changeMonth(month, 1);
      const propagated = await applyFixedTransactions(updatedList, nextMonth);

      updatedList.push(...propagated);
    }

    return updatedList;
  }

  if (editingTransaction.installmentGroupId != null) {
    const newTransactions = await updateInstallments(data, editingTransaction);

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
      const propagated = await applyFixedTransactions(updatedList, nextMonth);

      updatedList.push(...propagated);
    }

    return updatedList;
  }

  if (
    data.isFixed ||
    editingTransaction.isFixed ||
    editingTransaction.fixedGroupId != null
  ) {
    const updatedTransaction = await updateFixedTransaction(
      data,
      editingTransaction,
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
      await deleteTransaction(updatedTransaction.id);

      const newTransactions = await createInstallments(
        data,
        editingTransaction.month,
      );

      return [...remainingTransactions, ...newTransactions];
    }

    const updatedList = [...remainingTransactions, updatedTransaction];

    if (data.isFixed) {
      const nextMonth = changeMonth(editingTransaction.month, 1);
      const propagated = await applyFixedTransactions(updatedList, nextMonth);

      updatedList.push(...propagated);
    }

    return updatedList;
  }

  if (data.totalInstallments && data.totalInstallments > 1) {
    await deleteTransaction(editingTransaction.id);

    const newTransactions = await createInstallments(
      data,
      editingTransaction.month,
    );

    return [
      ...currentTransactions.filter(
        (transaction) => transaction.id !== editingTransaction.id,
      ),
      ...newTransactions,
    ];
  }

  const updatedTransaction = await updateTransaction(data, editingTransaction);

  return currentTransactions.map((transaction) =>
    transaction.id === editingTransaction.id ? updatedTransaction : transaction,
  );
}

export async function removeTransaction(
  itemToRemove: Transaction,
  currentTransactions: Transaction[],
): Promise<Transaction[]> {
  if (itemToRemove.installmentGroupId != null) {
    await deleteInstallments(itemToRemove);

    return currentTransactions.filter(
      (transaction) =>
        !(
          transaction.installmentGroupId === itemToRemove.installmentGroupId &&
          transaction.month >= itemToRemove.month
        ),
    );
  }

  if (itemToRemove.isFixed || itemToRemove.fixedGroupId != null) {
    await deleteFixedTransaction(itemToRemove);

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

  await deleteTransaction(itemToRemove.id);

  return currentTransactions.filter(
    (transaction) => transaction.id !== itemToRemove.id,
  );
}
