import { View, Text, StyleSheet, ScrollView, Keyboard } from "react-native";
import type { Transaction } from "@/types/transaction";
import { formatBRL } from "@/utils/format";
import { calculateAnalyticsSummary } from "@/utils/analytics-summary";
import { calculateFinancialSummary } from "@/utils/financial-summary";
import { SpendingChart } from "./analytics/spending-chart";
import { FinancialSummary } from "./analytics/financial-summary";
import { AIFinancialReport } from "./analytics/ai-financial-report";
import { useThemeColors, type ThemeColors } from "@/styles/theme";

interface AnalyticsViewProps {
  transactions: Transaction[];
  month: string;
}

export default function AnalyticsView({
  transactions,
  month,
}: AnalyticsViewProps) {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);

  const CATEGORY_COLORS = [
    COLORS.sageDark,
    COLORS.warning,
    COLORS.burgundyLight,
    COLORS.income,
    COLORS.sage,
    COLORS.expense,
    COLORS.burgundy,
    "#8E7C68",
  ];

  const { totalIncome, totalExpense, totalSavings, sortedCategories } =
    calculateAnalyticsSummary(transactions, month);
  const { previousCarryover } = calculateFinancialSummary(transactions, month);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onScrollBeginDrag={Keyboard.dismiss}
    >
      <SpendingChart
        sortedCategories={sortedCategories}
        totalExpense={totalExpense}
        categoryColors={CATEGORY_COLORS}
      />

      <Text style={styles.sectionTitle}>Detalhamento por Categoria</Text>

      {sortedCategories.map(([category, amount], index) => {
        const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
        const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

        return (
          <View key={category} style={styles.categoryRow}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryTitleRow}>
                <View style={[styles.colorDot, { backgroundColor: color }]} />
                <Text style={styles.categoryName}>{category}</Text>
              </View>

              <Text style={styles.categoryAmount}>
                {formatBRL(amount / 100)}
              </Text>
            </View>

            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>

            <Text style={styles.percentageText}>
              {percentage.toFixed(1)}% do total
            </Text>
          </View>
        );
      })}

      <FinancialSummary totalIncome={totalIncome} totalExpense={totalExpense} />

      <AIFinancialReport
        data={{
          month,
          totalIncome,
          totalExpenses: totalExpense,
          totalSavings,
          ...(previousCarryover > 0 ? { previousCarryover } : {}),
          expensesByCategory: sortedCategories.map(([category, amount]) => ({
            category,
            amount,
          })),
        }}
      />
    </ScrollView>
  );
}

const getStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: "100%",
    },
    contentContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 140,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: "Display Medium",
      color: COLORS.text,
      marginBottom: 12,
      marginTop: 10,
    },
    categoryRow: {
      backgroundColor: COLORS.surface,
      padding: 14,
      borderRadius: 14,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
    },
    categoryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    categoryTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    categoryName: {
      fontSize: 15,
      fontFamily: "Body SemiBold",
      color: COLORS.text,
    },
    categoryAmount: {
      fontSize: 15,
      fontFamily: "Body Bold",
      color: COLORS.expense,
    },
    progressBarBackground: {
      height: 8,
      backgroundColor: COLORS.surfaceMuted,
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: 6,
    },
    progressBarFill: {
      height: "100%",
      borderRadius: 4,
    },
    percentageText: {
      fontSize: 11,
      fontFamily: "Body Medium",
      color: COLORS.textSecondary,
      textAlign: "right",
    },
  });
