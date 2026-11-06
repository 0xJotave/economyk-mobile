import { useState, useEffect, useRef, useCallback } from "react";
import type { Transaction } from "@/types/transaction";
import { transactions as transactionsTable } from "@/db/schema";
import { db } from "@/db";
import { getCurrentMonth, changeMonth } from "@/utils/month";
import { applyFixedTransactions } from "@/features/transactions/services/fixed-transaction-service";
import {
  saveTransaction,
  removeTransaction,
} from "@/features/transactions/services/transaction-management-service";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [month, setMonth] = useState(getCurrentMonth);
  const [isChangingMonth, setIsChangingMonth] = useState(false);
  const isChangingMonthRef = useRef(false);

  const loadData = useCallback(async () => {
    const loadedTransactions = (await db
      .select()
      .from(transactionsTable)) as Transaction[];

    await applyFixedTransactions(
      loadedTransactions,
      getCurrentMonth(),
    );

    setTransactions(db.select().from(transactionsTable).all() as Transaction[]);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = useCallback(
    async (
      data: Parameters<typeof saveTransaction>[0],
      editingTransaction: Transaction | null,
      closeModal: () => void,
    ) => {
      await saveTransaction(
        data,
        editingTransaction,
        month,
        transactions,
      );

      setTransactions(db.select().from(transactionsTable).all() as Transaction[]);
      closeModal();
    },
    [month, transactions],
  );

  const handleRemoveTransaction = useCallback(
    async (itemToRemove: Transaction) => {
      await removeTransaction(
        itemToRemove,
        transactions,
      );

      setTransactions(db.select().from(transactionsTable).all() as Transaction[]);
    },
    [transactions],
  );

  const handleMonthChange = useCallback(
    async (step: 1 | -1) => {
      if (isChangingMonthRef.current) return;

      isChangingMonthRef.current = true;
      setIsChangingMonth(true);

      try {
        const nextMonth = changeMonth(month, step);
        await applyFixedTransactions(transactions, nextMonth);

        setTransactions(db.select().from(transactionsTable).all() as Transaction[]);

        setMonth(nextMonth);
      } catch (error) {
        console.error("Erro ao mudar de mês:", error);
      } finally {
        isChangingMonthRef.current = false;
        setIsChangingMonth(false);
      }
    },
    [month, transactions],
  );

  return {
    transactions,
    setTransactions,
    month,
    setMonth,
    loadData,
    handleSave,
    removeTransaction: handleRemoveTransaction,
    handleMonthChange,
    isChangingMonth,
  };
}
