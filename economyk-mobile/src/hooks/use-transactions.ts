import { useState, useEffect, useRef } from "react";
import { Transaction, NewTransaction } from "@/types/transaction";
import {
  transactions as transactionsTable,
  fixedGroupClosures,
} from "@/db/schema";
import { db } from "@/db";
import { eq, and, gte, or } from "drizzle-orm";
import { getCurrentMonth, changeMonth } from "@/utils/month";
import { calculateFixedTransactions } from "@/utils/fixed";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [month, setMonth] = useState(getCurrentMonth);

  // Impede mudanças de mês simultâneas.
  const [isChangingMonth, setIsChangingMonth] = useState(false);
  const isChangingMonthRef = useRef(false);

  // =====================================================
  // 1. PROPAGAÇÃO DE RECORRÊNCIAS
  // =====================================================

  const checkAndApplyFixedTransactions = async (
    currentTransactions: Transaction[],
    targetMonth: string,
  ) => {
    const closures = await db.select().from(fixedGroupClosures);

    const fixedTransactions = calculateFixedTransactions(
      currentTransactions,
      targetMonth,
      closures,
    );

    if (fixedTransactions.length > 0) {
      await db.insert(transactionsTable).values(fixedTransactions);

      return fixedTransactions;
    }

    return [];
  };

  // =====================================================
  // 2. ENCERRAMENTO DE RECORRÊNCIA
  // =====================================================

  const closeFixedGroup = async (groupId: number, fromMonth: string) => {
    await db
      .delete(fixedGroupClosures)
      .where(eq(fixedGroupClosures.fixedGroupId, groupId));

    await db.insert(fixedGroupClosures).values({
      fixedGroupId: groupId,
      fromMonth,
    });
  };

  const reopenFixedGroup = async (groupId: number) => {
    await db
      .delete(fixedGroupClosures)
      .where(eq(fixedGroupClosures.fixedGroupId, groupId));
  };

  // =====================================================
  // 3. CARREGAMENTO
  // =====================================================

  const loadData = async () => {
    const loadedTransactions = (await db
      .select()
      .from(transactionsTable)) as Transaction[];

    const currentMonthStr = getCurrentMonth();

    const newFixed = await checkAndApplyFixedTransactions(
      loadedTransactions,
      currentMonthStr,
    );

    setTransactions([...loadedTransactions, ...newFixed]);
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // 4. SALVAR / EDITAR
  // =====================================================

  const handleSave = async (
    data: NewTransaction,
    editingTransaction: Transaction | null,
    closeModal: () => void,
  ) => {
    if (editingTransaction) {
      // -------------------------------------------------
      // PARCELAMENTOS
      // -------------------------------------------------

      if (editingTransaction.installmentGroupId != null) {
        const currentInstallmentNum = editingTransaction.installmentNumber || 1;

        const total =
          data.totalInstallments && data.totalInstallments > 1
            ? data.totalInstallments
            : editingTransaction.totalInstallments || 1;

        const groupId = editingTransaction.installmentGroupId;

        // Preserva as parcelas anteriores à selecionada.
        // Exclui somente a selecionada e as posteriores.
        await db
          .delete(transactionsTable)
          .where(
            and(
              eq(transactionsTable.installmentGroupId, groupId),
              gte(transactionsTable.month, editingTransaction.month),
            ),
          );

        setTransactions((prev) =>
          prev.filter(
            (transaction) =>
              !(
                transaction.installmentGroupId === groupId &&
                transaction.month >= editingTransaction.month
              ),
          ),
        );

        const newTransactions: Transaction[] = [];

        // Recria somente a parcela selecionada e as posteriores.
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
            installmentNumber: total > 1 ? i : undefined,
            totalInstallments: total > 1 ? total : undefined,
            installmentGroupId: total > 1 ? groupId : undefined,
          });
        }

        if (newTransactions.length > 0) {
          await db.insert(transactionsTable).values(newTransactions);

          setTransactions((prev) => [...prev, ...newTransactions]);
        }
      }

      // -------------------------------------------------
      // TRANSAÇÕES FIXAS
      // -------------------------------------------------
      else if (
        editingTransaction.isFixed ||
        editingTransaction.fixedGroupId != null
      ) {
        const groupId =
          editingTransaction.fixedGroupId ?? editingTransaction.id;

        // Remove somente as ocorrências do mês selecionado
        // em diante. O histórico anterior permanece intacto.
        await db
          .delete(transactionsTable)
          .where(
            and(
              or(
                eq(transactionsTable.fixedGroupId, groupId),
                eq(transactionsTable.id, groupId),
              ),
              gte(transactionsTable.month, editingTransaction.month),
            ),
          );

        setTransactions((prev) =>
          prev.filter(
            (transaction) =>
              !(
                (transaction.fixedGroupId === groupId ||
                  transaction.id === groupId) &&
                transaction.month >= editingTransaction.month
              ),
          ),
        );

        // Se continuar fixa, remove eventual encerramento anterior.
        // Se deixar de ser fixa, encerra a recorrência a partir
        // do mês seguinte ao selecionado.
        if (data.isFixed) {
          await reopenFixedGroup(groupId);
        } else {
          const nextMonth = changeMonth(editingTransaction.month, 1);

          await closeFixedGroup(groupId, nextMonth);
        }

        const updatedTransaction: Transaction = {
          ...data,
          id: editingTransaction.id,
          month: editingTransaction.month,
          fixedGroupId: data.isFixed ? groupId : undefined,
        };

        await db.insert(transactionsTable).values(updatedTransaction);

        setTransactions((prev) => [...prev, updatedTransaction]);
      }

      // -------------------------------------------------
      // TRANSAÇÃO NORMAL
      // -------------------------------------------------
      else {
        const updatedTransaction: Transaction = {
          ...data,
          id: editingTransaction.id,
          month: editingTransaction.month,
        };

        await db
          .update(transactionsTable)
          .set(data)
          .where(eq(transactionsTable.id, editingTransaction.id));

        setTransactions((prev) =>
          prev.map((transaction) =>
            transaction.id === editingTransaction.id
              ? updatedTransaction
              : transaction,
          ),
        );
      }
    }

    // ===================================================
    // 5. CRIAÇÃO
    // ===================================================
    else {
      // -------------------------------------------------
      // PARCELAMENTOS
      // -------------------------------------------------

      if (data.totalInstallments && data.totalInstallments > 1) {
        const total = data.totalInstallments;
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
          });
        }

        await db.insert(transactionsTable).values(newTransactions);

        setTransactions((prev) => [...prev, ...newTransactions]);
      }

      // -------------------------------------------------
      // TRANSAÇÃO NORMAL OU FIXA
      // -------------------------------------------------
      else {
        const id = Date.now();

        const fixedGroupId = data.isFixed ? id : undefined;

        const newTransaction: Transaction = {
          ...data,
          id,
          month,
          fixedGroupId,
        };

        await db.insert(transactionsTable).values(newTransaction);

        let updatedList = [...transactions, newTransaction];

        // Propaga para o próximo mês quando for fixa.
        if (newTransaction.isFixed) {
          const nextMonth = changeMonth(month, 1);

          const propagated = calculateFixedTransactions(updatedList, nextMonth);

          if (propagated.length > 0) {
            await db.insert(transactionsTable).values(propagated);

            updatedList = [...updatedList, ...propagated];
          }
        }

        setTransactions(updatedList);
      }
    }

    closeModal();
  };

  // =====================================================
  // 6. EXCLUSÃO
  // =====================================================

  const removeTransaction = async (itemToRemove: Transaction) => {
    // -------------------------------------------------
    // PARCELAMENTOS
    // -------------------------------------------------

    if (itemToRemove.installmentGroupId != null) {
      const groupId = itemToRemove.installmentGroupId;

      // Exclui a parcela selecionada e todas as posteriores.
      // As parcelas anteriores permanecem intactas.
      await db
        .delete(transactionsTable)
        .where(
          and(
            eq(transactionsTable.installmentGroupId, groupId),
            gte(transactionsTable.month, itemToRemove.month),
          ),
        );

      setTransactions((prev) =>
        prev.filter(
          (transaction) =>
            !(
              transaction.installmentGroupId === groupId &&
              transaction.month >= itemToRemove.month
            ),
        ),
      );

      return;
    }

    // -------------------------------------------------
    // RECORRÊNCIAS FIXAS
    // -------------------------------------------------

    if (itemToRemove.isFixed || itemToRemove.fixedGroupId != null) {
      const groupId = itemToRemove.fixedGroupId ?? itemToRemove.id;

      // Registra o encerramento para impedir que a recorrência
      // seja criada novamente automaticamente.
      await closeFixedGroup(groupId, itemToRemove.month);

      // Exclui somente as ocorrências do mês selecionado
      // em diante.
      await db
        .delete(transactionsTable)
        .where(
          and(
            or(
              eq(transactionsTable.fixedGroupId, groupId),
              eq(transactionsTable.id, groupId),
            ),
            gte(transactionsTable.month, itemToRemove.month),
          ),
        );

      setTransactions((prev) =>
        prev.filter(
          (transaction) =>
            !(
              (transaction.fixedGroupId === groupId ||
                transaction.id === groupId) &&
              transaction.month >= itemToRemove.month
            ),
        ),
      );

      return;
    }

    // -------------------------------------------------
    // TRANSAÇÃO NORMAL
    // -------------------------------------------------

    await db
      .delete(transactionsTable)
      .where(eq(transactionsTable.id, itemToRemove.id));

    setTransactions((prev) =>
      prev.filter((transaction) => transaction.id !== itemToRemove.id),
    );
  };

  // =====================================================
  // 7. MUDANÇA DE MÊS
  // =====================================================

  const handleMonthChange = async (step: 1 | -1) => {
    // Evita iniciar outra mudança enquanto a atual não termina.
    if (isChangingMonthRef.current) return;

    isChangingMonthRef.current = true;
    setIsChangingMonth(true);

    try {
      const nextMonth = changeMonth(month, step);

      // Primeiro prepara as transações do mês de destino.
      const newFixed = await checkAndApplyFixedTransactions(
        transactions,
        nextMonth,
      );

      // Atualiza as transações antes de trocar o mês exibido.
      if (newFixed.length > 0) {
        setTransactions((prev) => [...prev, ...newFixed]);
      }

      // Só agora o mês muda.
      setMonth(nextMonth);
    } catch (error) {
      console.error("Erro ao mudar de mês:", error);
    } finally {
      isChangingMonthRef.current = false;
      setIsChangingMonth(false);
    }
  };

  return {
    transactions,
    setTransactions,
    month,
    setMonth,
    loadData,
    handleSave,
    removeTransaction,
    handleMonthChange,
    isChangingMonth,
  };
}
