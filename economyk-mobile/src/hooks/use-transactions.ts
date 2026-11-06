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

    const newFixed = await applyFixedTransactions(
      loadedTransactions,
      getCurrentMonth(),
    );

    setTransactions([...loadedTransactions, ...newFixed]);
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
      const updatedTransactions = await saveTransaction(
        data,
        editingTransaction,
        month,
        transactions,
      );

      setTransactions(updatedTransactions);
      closeModal();
    },
    [month, transactions],
  );

  const handleRemoveTransaction = useCallback(
    async (itemToRemove: Transaction) => {
      const updatedTransactions = await removeTransaction(
        itemToRemove,
        transactions,
      );

      setTransactions(updatedTransactions);
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
        const newFixed = await applyFixedTransactions(transactions, nextMonth);

        if (newFixed.length > 0) {
          setTransactions((previous) => [...previous, ...newFixed]);
        }

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
