import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { formatBRL } from "@/utils/format";
import { useThemeColors, ThemeColors } from "@/styles/theme";

interface FinancialSummaryProps {
  totalIncome: number;
  totalExpense: number;
}

export function FinancialSummary({
  totalIncome,
  totalExpense,
}: FinancialSummaryProps) {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);

  const result = totalIncome - totalExpense;

  return (
    <View style={styles.summaryContainer}>
      <Text style={styles.sectionTitle}>Resumo do mês</Text>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total de receitas</Text>
        <Text style={[styles.summaryValue, { color: COLORS.income }]}>
          {formatBRL(totalIncome / 100)}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total de despesas</Text>
        <Text style={[styles.summaryValue, { color: COLORS.expense }]}>
          {formatBRL(totalExpense / 100)}
        </Text>
      </View>

      <View style={styles.summaryDivider} />

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabelBold}>Resultado</Text>
        <Text
          style={[
            styles.summaryValueBold,
            { color: result >= 0 ? COLORS.income : COLORS.expense },
          ]}
        >
          {formatBRL(result / 100)}
        </Text>
      </View>
    </View>
  );
}

const getStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    summaryContainer: {
      backgroundColor: COLORS.surface,
      borderRadius: 16,
      padding: 16,
      marginTop: 8,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: "Display Medium",
      color: COLORS.text,
      marginBottom: 12,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 14,
      fontFamily: "Body Medium",
      color: COLORS.textSecondary,
    },
    summaryValue: {
      fontSize: 14,
      fontFamily: "Body Bold",
    },
    summaryDivider: {
      height: 1,
      backgroundColor: COLORS.border,
      marginVertical: 6,
    },
    summaryLabelBold: {
      fontSize: 15,
      fontFamily: "Body SemiBold",
      color: COLORS.text,
    },
    summaryValueBold: {
      fontSize: 16,
      fontFamily: "Body Bold",
    },
  });
