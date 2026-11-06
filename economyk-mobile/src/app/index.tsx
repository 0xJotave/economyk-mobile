import { Alert, Keyboard, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import type { Transaction } from "@/types/transaction";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";

import { HomeTabs } from "@/components/home-tabs";
import type { ActiveTab, FilterType } from "@/components/home-tabs";
import { MonthNavigation } from "@/components/month-navigation";
import { FinancialSummary } from "@/components/financial-summary";
import { TransactionsContent } from "@/components/transactions-content";

import TransactionModal from "@/components/transaction-modal";
import { SettingsModal } from "@/components/settings-modal";

import { getHomeStyles } from "@/styles/home.styles";
import { useThemeColors } from "@/styles/theme";

import { calculateFinancialSummary } from "@/utils/financial-summary";

import {
  exportBackup,
  selectBackup,
  restoreBackup,
} from "@/services/backup-service";

export default function HomeScreen() {
  const COLORS = useThemeColors();
  const styles = getHomeStyles(COLORS);

  const {
    transactions,
    month,
    loadData,
    handleSave,
    removeTransaction,
    handleMonthChange,
    isChangingMonth,
  } = useTransactions();

  const [activeTab, setActiveTab] = useState<ActiveTab>("transactions");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    "Todas",
  );

  const {
    categories,
    loadCategories,
    handleAddCategory,
    handleDeleteCategory,
    handleEditCategory,
  } = useCategories({ loadTransactionsData: loadData });

  const [isModalOpen, setModalOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const financialSummary = calculateFinancialSummary(transactions, month);

  const balance = {
    remainingAmount: financialSummary.remainingAmount,
    monthlyResult: financialSummary.monthlyResult,
    previousCarryover: financialSummary.previousCarryover,
    totalAvailable: financialSummary.totalAvailable,
    unconfirmedCount: financialSummary.unconfirmedCount,
    unconfirmedItems: financialSummary.unconfirmedItems,
  };

  const filteredItems = financialSummary.monthTransactions.filter((item) => {
    const matchesType =
      selectedFilter === "all" || item.type === selectedFilter;

    const matchesCategory =
      selectedCategory === "Todas" ||
      selectedCategory === null ||
      item.category === selectedCategory;

    return matchesType && matchesCategory;
  });

  const openNew = () => {
    Keyboard.dismiss();
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const openEdit = (transaction: Transaction) => {
    Keyboard.dismiss();
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTransaction(null);
  };

  const handleBackup = async () => {
    setSettingsOpen(false);

    try {
      await exportBackup();
    } catch (error) {
      console.error("Erro ao exportar backup:", error);

      Alert.alert(
        "Erro no backup",
        "Não foi possível exportar seus dados. Tente novamente.",
      );
    }
  };

  const handleRestore = async () => {
    setSettingsOpen(false);

    try {
      const backup = await selectBackup();

      if (!backup) return;

      Alert.alert(
        "Confirmar restauração",
        `O backup de ${new Date(backup.createdAt).toLocaleString("pt-BR")} contém:\n\n` +
          `${backup.data.transactions.length} transações\n` +
          `${backup.data.categories.length} categorias\n\n` +
          "Todos os dados atuais serão substituídos. Essa ação não poderá ser desfeita.",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Restaurar",
            style: "destructive",
            onPress: async () => {
              try {
                restoreBackup(backup);

                await loadData();
                await loadCategories();

                setSelectedCategory("Todas");

                Alert.alert(
                  "Backup restaurado",
                  "Seus dados foram restaurados com sucesso.",
                );
              } catch (error) {
                console.error("Erro ao restaurar backup:", error);

                Alert.alert(
                  "Erro na restauração",
                  "Não foi possível restaurar o backup. Seus dados anteriores foram preservados.",
                );
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error("Erro ao selecionar backup:", error);

      Alert.alert(
        "Erro ao restaurar backup",
        error instanceof Error
          ? error.message
          : "Não foi possível ler o arquivo de backup.",
      );
    }
  };

  const confirmRemoveTransaction = (itemToRemove: Transaction) => {
    let title = "Apagar transação?";
    let message = "Essa ação não poderá ser desfeita.";

    if (itemToRemove.installmentGroupId != null) {
      title = "Apagar parcelas futuras?";
      message =
        "A parcela selecionada e todas as posteriores serão apagadas. As parcelas anteriores serão preservadas no histórico.";
    } else if (itemToRemove.isFixed || itemToRemove.fixedGroupId != null) {
      title = "Encerrar transação fixa?";
      message =
        "Esta ocorrência e todas as posteriores serão apagadas. O histórico dos meses anteriores será preservado.";
    }

    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: () => removeTransaction(itemToRemove),
      },
    ]);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <HomeTabs
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <MonthNavigation
          month={month}
          isChangingMonth={isChangingMonth}
          onChangeMonth={handleMonthChange}
        />

        <FinancialSummary
          balance={balance}
          incomes={financialSummary.income}
          expenses={financialSummary.expenses}
          activeTab={activeTab}
        />

        <View style={styles.mainContent}>
          <TransactionsContent
            activeTab={activeTab}
            transactions={transactions}
            month={month}
            filteredItems={filteredItems}
            categories={categories}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onEdit={openEdit}
            onDelete={confirmRemoveTransaction}
          />
        </View>

        {activeTab === "transactions" && (
          <TouchableOpacity
            style={styles.fab}
            onPress={openNew}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={28} color={COLORS.white} />
          </TouchableOpacity>
        )}

        <SettingsModal
          visible={isSettingsOpen}
          onClose={() => setSettingsOpen(false)}
          onBackup={handleBackup}
          onRestore={handleRestore}
        />

        <TransactionModal
          visible={isModalOpen}
          categories={categories}
          onClose={closeModal}
          onSave={(data) => handleSave(data, editingTransaction, closeModal)}
          onAddCategory={handleAddCategory}
          onDeleteCategory={(name) =>
            handleDeleteCategory(name, selectedCategory, setSelectedCategory)
          }
          onEditCategory={(oldName, newName) =>
            handleEditCategory(
              oldName,
              newName,
              selectedCategory,
              setSelectedCategory,
            )
          }
          transactionToEdit={editingTransaction}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
