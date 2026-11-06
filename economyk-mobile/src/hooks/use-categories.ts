import { useState, useEffect, useRef, useCallback } from "react";
import {
  categories as categoriesTable,
  transactions as transactionsTable,
} from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { Alert } from "react-native";

interface UseCategoriesProps {
  loadTransactionsData: () => Promise<void>;
}

const DEFAULT_CATEGORIES = [
  "Contas",
  "Alimentação",
  "Auto Cuidado",
  "Trabalho",
  "Investimentos",
];

export function useCategories({ loadTransactionsData }: UseCategoriesProps) {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const isMutatingRef = useRef(false);

  const loadCategories = useCallback(async () => {
    const loadedCategories = await db.select().from(categoriesTable);

    if (loadedCategories.length > 0) {
      setCategories(loadedCategories.map((category) => category.name));
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleAddCategory = useCallback(
    async (name: string): Promise<boolean> => {
      if (isMutatingRef.current) return false;

      isMutatingRef.current = true;

      try {
        const trimmed = name.trim();

        if (!trimmed) return false;

        const exists = categories.some(
          (category) => category.toLowerCase() === trimmed.toLowerCase(),
        );

        if (exists) {
          Alert.alert(
            "Categoria existente",
            "Essa categoria já está cadastrada.",
          );
          return false;
        }

        await db.insert(categoriesTable).values({ name: trimmed });

        setCategories((previous) => [...previous, trimmed]);
        return true;
      } finally {
        isMutatingRef.current = false;
      }
    },
    [categories],
  );

  const handleDeleteCategory = useCallback(
    async (
      categoryName: string,
      selectedCategory: string | null,
      setSelectedCategory: (category: string | null) => void,
    ): Promise<boolean> => {
      if (isMutatingRef.current) return false;

      isMutatingRef.current = true;

      try {
        const matchingTransactions = await db
          .select({ id: transactionsTable.id })
          .from(transactionsTable)
          .where(eq(transactionsTable.category, categoryName))
          .limit(1);

        if (matchingTransactions.length > 0) {
          Alert.alert(
            "Não é possível apagar",
            `A categoria "${categoryName}" possui transações vinculadas. Remova ou altere essas transações primeiro.`,
          );
          return false;
        }

        await db
          .delete(categoriesTable)
          .where(eq(categoriesTable.name, categoryName));

        setCategories((previous) =>
          previous.filter((category) => category !== categoryName),
        );

        if (selectedCategory === categoryName) {
          setSelectedCategory("Todas");
        }

        return true;
      } finally {
        isMutatingRef.current = false;
      }
    },
    [],
  );

  const handleEditCategory = useCallback(
    async (
      oldCategoryName: string,
      newCategoryName: string,
      selectedCategory: string | null,
      setSelectedCategory: (category: string | null) => void,
    ): Promise<boolean> => {
      if (isMutatingRef.current) return false;

      isMutatingRef.current = true;

      try {
        const trimmed = newCategoryName.trim();

        if (!trimmed) return false;

        if (trimmed === oldCategoryName) return true;

        const exists = categories.some(
          (category) =>
            category !== oldCategoryName &&
            category.toLowerCase() === trimmed.toLowerCase(),
        );

        if (exists) {
          Alert.alert(
            "Categoria existente",
            "Essa categoria já está cadastrada.",
          );
          return false;
        }

        await db
          .update(categoriesTable)
          .set({ name: trimmed })
          .where(eq(categoriesTable.name, oldCategoryName));

        await db
          .update(transactionsTable)
          .set({ category: trimmed })
          .where(eq(transactionsTable.category, oldCategoryName));

        await loadTransactionsData();

        setCategories((previous) =>
          previous.map((category) =>
            category === oldCategoryName ? trimmed : category,
          ),
        );

        if (selectedCategory === oldCategoryName) {
          setSelectedCategory(trimmed);
        }

        return true;
      } finally {
        isMutatingRef.current = false;
      }
    },
    [categories, loadTransactionsData],
  );

  return {
    categories,
    loadCategories,
    handleAddCategory,
    handleDeleteCategory,
    handleEditCategory,
  };
}
