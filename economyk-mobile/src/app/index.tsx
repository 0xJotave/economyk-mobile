import {
  Alert,
  FlatList,
  Text,
  View,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import calculateBalance from "@/utils/balance";
import { formatBRL } from "@/utils/format";
import { useState } from "react";
import { Transaction } from "@/types/transaction";
import TransactionModal from "@/components/transaction-modal";
import AnalyticsView from "@/components/analytics-view";
import { TransactionItem } from "@/components/transaction-item";
import { TransactionsFilter } from "@/components/transactions-filter";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { Feather } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { getHomeStyles } from "@/styles/home.styles";
import { useThemeColors } from "@/styles/theme";
import { FloatingThemeButton } from "@/components/floating-theme-button";

type FilterType = "all" | "income" | "expense";
type ActiveTab = "transactions" | "analytics";

export default function HomeScreen() {
  // 1. Injetar as cores do tema dinâmico (Claro ou Escuro)
  const COLORS = useThemeColors();

  // 2. Gerar os estilos com base nessas cores
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
    handleAddCategory,
    handleDeleteCategory,
    handleEditCategory,
  } = useCategories(loadData);

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const balance = calculateBalance(transactions, month);
  const monthItems = transactions.filter((item) => item.month === month);

  const filteredItems = monthItems.filter((item) => {
    const matchesType =
      selectedFilter === "all" ? true : item.type === selectedFilter;

    const matchesCategory =
      selectedCategory === "Todas" || selectedCategory === null
        ? true
        : item.category === selectedCategory;

    return matchesType && matchesCategory;
  });

  const incomes = monthItems
    .filter((transaction) => transaction.type === "income")
    .reduce((acc, curr) => acc + curr.price, 0);

  const expenses = monthItems
    .filter((transaction) => transaction.type === "expense")
    .reduce((acc, curr) => acc + curr.price, 0);

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
        {/* SWITCH SUPERIOR (Transações / Analytics) */}
        <View style={styles.topSwitchContainer}>
          <TouchableOpacity
            style={[
              styles.switchButton,
              activeTab === "transactions" && styles.switchButtonActive,
            ]}
            onPress={() => setActiveTab("transactions")}
          >
            <Feather
              name="list"
              size={16}
              color={
                activeTab === "transactions"
                  ? COLORS.white
                  : COLORS.textSecondary
              }
            />
            <Text
              style={[
                styles.switchText,
                activeTab === "transactions" && styles.switchTextActive,
              ]}
            >
              Transações
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switchButton,
              activeTab === "analytics" && styles.switchButtonActive,
            ]}
            onPress={() => setActiveTab("analytics")}
          >
            <Feather
              name="pie-chart"
              size={16}
              color={
                activeTab === "analytics" ? COLORS.white : COLORS.textSecondary
              }
            />
            <Text
              style={[
                styles.switchText,
                activeTab === "analytics" && styles.switchTextActive,
              ]}
            >
              Estatísticas
            </Text>
          </TouchableOpacity>

          <FloatingThemeButton />
        </View>

        {/* HEADER / MÊS (Sem o botão duplicado) */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => handleMonthChange(-1)}
            style={styles.monthButton}
            disabled={isChangingMonth}
          >
            <Feather
              name="chevron-left"
              size={24}
              color={isChangingMonth ? COLORS.surfaceMuted : COLORS.text}
            />
          </TouchableOpacity>

          <View style={styles.monthTitleContainer}>
            {(() => {
              const [year, monthNum] = month.split("-");
              const monthsShort = [
                "",
                "Jan",
                "Fev",
                "Mar",
                "Abr",
                "Mai",
                "Jun",
                "Jul",
                "Ago",
                "Set",
                "Out",
                "Nov",
                "Dez",
              ];
              const shortName = monthsShort[Number(monthNum)] || "Mês";
              return (
                <>
                  <Text style={styles.monthText}>{shortName}</Text>
                  <Text style={styles.yearText}>{`${monthNum}-${year}`}</Text>
                </>
              );
            })()}
          </View>

          <TouchableOpacity
            onPress={() => handleMonthChange(1)}
            style={styles.monthButton}
            disabled={isChangingMonth}
          >
            <Feather
              name="chevron-right"
              size={24}
              color={isChangingMonth ? COLORS.surfaceMuted : COLORS.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.dashboard}>
          <View
            style={[
              styles.mainCard,
              balance.remainingAmount < 0 && styles.mainCardNegative,
            ]}
          >
            <Text style={styles.cardLabelVisible}>Saldo Atual</Text>
            <Text style={styles.mainCardValue}>
              {formatBRL(balance.remainingAmount / 100)}
            </Text>
          </View>

          {activeTab === "transactions" && (
            <View style={styles.subCardsRow}>
              <View style={styles.subCard}>
                <Feather
                  name="arrow-up-circle"
                  size={20}
                  color={COLORS.income}
                />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.subCardLabel}>Receitas</Text>
                  <Text style={[styles.subCardValue, { color: COLORS.income }]}>
                    {formatBRL(incomes / 100)}
                  </Text>
                </View>
              </View>

              <View style={styles.subCard}>
                <Feather
                  name="arrow-down-circle"
                  size={20}
                  color={COLORS.expense}
                />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.subCardLabel}>Despesas</Text>
                  <Text
                    style={[styles.subCardValue, { color: COLORS.expense }]}
                  >
                    {formatBRL(expenses / 100)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {activeTab === "transactions" && balance.unconfirmedCount > 0 && (
          <View style={styles.unconfirmedAlert}>
            <Feather name="alert-circle" size={16} color={COLORS.warning} />
            <Text style={styles.unconfirmedText}>
              Você tem {balance.unconfirmedCount} transações não confirmadas.
            </Text>
          </View>
        )}

        <View style={styles.mainContent}>
          {activeTab === "transactions" ? (
            <>
              <TransactionsFilter
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                categories={categories}
              />
              <View style={styles.listContainer}>
                <FlatList
                  data={filteredItems}
                  keyExtractor={(item) => String(item.id)}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
                  renderItem={({ item }) => (
                    <TransactionItem
                      item={item}
                      onEdit={openEdit}
                      onDelete={() => confirmRemoveTransaction(item)}
                    />
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Feather name="inbox" size={48} color={COLORS.border} />
                      <Text style={styles.emptyStateText}>
                        Nenhuma transação encontrada
                      </Text>
                    </View>
                  }
                />
              </View>
            </>
          ) : (
            <View style={styles.analyticsContainer}>
              <AnalyticsView transactions={transactions} month={month} />
            </View>
          )}
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
