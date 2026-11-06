import { View, FlatList, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Transaction } from "@/types/transaction";
import AnalyticsView from "./analytics-view";
import { TransactionItem } from "./transaction-item";
import { TransactionsFilter } from "./transactions-filter";
import { getHomeStyles } from "@/styles/home.styles";
import { useThemeColors } from "@/styles/theme";

export type FilterType = "all" | "income" | "expense";
type ActiveTab = "transactions" | "analytics";

interface TransactionsContentProps {
  activeTab: ActiveTab;
  transactions: Transaction[];
  month: string;
  filteredItems: Transaction[];
  categories: string[];
  selectedFilter: FilterType;
  setSelectedFilter: (filter: FilterType) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function TransactionsContent({
  activeTab,
  transactions,
  month,
  filteredItems,
  categories,
  selectedFilter,
  setSelectedFilter,
  selectedCategory,
  setSelectedCategory,
  onEdit,
  onDelete,
}: TransactionsContentProps) {
  const COLORS = useThemeColors();
  const styles = getHomeStyles(COLORS);

  if (activeTab === "analytics") {
    return (
      <View style={styles.analyticsContainer}>
        <AnalyticsView transactions={transactions} month={month} />
      </View>
    );
  }

  return (
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
              onEdit={onEdit}
              onDelete={() => onDelete(item)}
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
  );
}
