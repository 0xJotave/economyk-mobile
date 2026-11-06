import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import type calculateBalance from "@/utils/balance";
import { formatBRL } from "@/utils/format";
import { getHomeStyles } from "@/styles/home.styles";
import { useThemeColors } from "@/styles/theme";
import type { ActiveTab } from "./home-tabs";

interface FinancialSummaryProps {
  balance: ReturnType<typeof calculateBalance>;
  incomes: number;
  expenses: number;
  savings: number;
  activeTab: ActiveTab;
}

export function FinancialSummary({
  balance,
  incomes,
  expenses,
  savings,
  activeTab,
}: FinancialSummaryProps) {
  const COLORS = useThemeColors();
  const styles = getHomeStyles(COLORS);
  const availableBalance = balance.remainingAmount + balance.previousCarryover;

  return (
    <>
      <View style={styles.dashboard}>
        <View
          style={[
            styles.mainCard,
            availableBalance < 0 && styles.mainCardNegative,
          ]}
        >
          <Text style={styles.cardLabelVisible}>Total Disponível</Text>
          <Text style={styles.mainCardValue}>
            {formatBRL(availableBalance / 100)}
          </Text>
          {balance.previousCarryover > 0 && (
            <Text style={styles.mainCardSubtitle}>
              Sobra do Mês Anterior: {formatBRL(balance.previousCarryover / 100)}
            </Text>
          )}
        </View>

        {activeTab === "transactions" && (
          <View style={styles.subCardsRow}>
            <View style={styles.subCard}>
              <Feather name="arrow-up-circle" size={20} color={COLORS.income} />

              <View style={styles.subCardContent}>
                <Text style={styles.subCardLabel}>Receitas</Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[styles.subCardValue, { color: COLORS.income }]}
                >
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

              <View style={styles.subCardContent}>
                <Text style={styles.subCardLabel}>Despesas</Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[styles.subCardValue, { color: COLORS.expense }]}
                >
                  {formatBRL(expenses / 100)}
                </Text>
              </View>
            </View>

            <View style={styles.subCard}>
              <Feather name="archive" size={20} color={COLORS.sageDark} />

              <View style={styles.subCardContent}>
                <Text style={styles.subCardLabel}>Investimentos</Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[styles.subCardValue, { color: COLORS.sageDark }]}
                >
                  {formatBRL(savings / 100)}
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
    </>
  );
}
