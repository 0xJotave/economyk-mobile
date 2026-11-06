import { useState, useEffect } from "react";
import {
  categories as categoriesTable,
  transactions as transactionsTable,
} from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { Alert } from "react-native";

export function useCategories(loadTransactionsData: () => void) {
  const [categories, setCategories] = useState<string[]>([
    "Contas",
    "Alimentação",
    "Auto Cuidado",
    "Trabalho",
    "Investimentos",
  ]);

  const loadCategories = async () => {
    const loadedCategories = await db.select().from(categoriesTable);
    if (loadedCategories.length > 0) {
      setCategories(loadedCategories.map((c) => c.name));
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = async (name: string) => {
    await db.insert(categoriesTable).values({ name });
    setCategories((prev) => [...prev, name]);
  };

  const handleDeleteCategory = async (
    categoryName: string,
    selectedCategory: string | null,
    setSelectedCategory: (c: string) => void,
  ) => {
    // 1. Verifica se existem transações usando esta categoria no banco
    const matchingTransactions = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.category, categoryName));

    if (matchingTransactions.length > 0) {
      Alert.alert(
        "Não é possível apagar",
        `A categoria "${categoryName}" possui ${matchingTransactions.length} transação(ões) vinculada(s). Renomeie a categoria ou remova as transações primeiro.`,
      );
      return;
    }

    // 2. Se estiver vazia, prossegue com a exclusão
    await db
      .delete(categoriesTable)
      .where(eq(categoriesTable.name, categoryName));
    setCategories((prev) => prev.filter((c) => c !== categoryName));
    if (selectedCategory === categoryName) setSelectedCategory("Todas");
  };

  const handleEditCategory = async (
    oldCategoryName: string,
    newCategoryName: string,
    selectedCategory: string | null,
    setSelectedCategory: (c: string) => void,
  ) => {
    const trimmed = newCategoryName.trim();
    if (!trimmed || trimmed === oldCategoryName) return;

    await db
      .update(categoriesTable)
      .set({ name: trimmed })
      .where(eq(categoriesTable.name, oldCategoryName));
    await db
      .update(transactionsTable)
      .set({ category: trimmed })
      .where(eq(transactionsTable.category, oldCategoryName));

    setCategories((prev) =>
      prev.map((c) => (c === oldCategoryName ? trimmed : c)),
    );
    if (selectedCategory === oldCategoryName) setSelectedCategory(trimmed);
    loadTransactionsData();
  };

  return {
    categories,
    loadCategories,
    handleAddCategory,
    handleDeleteCategory,
    handleEditCategory,
  };
}
