import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import calculateBalance from "@/utils/balance";
import { formatBRL } from "@/utils/format";
import { getHomeStyles } from "@/styles/home.styles";
import { useThemeColors } from "@/styles/theme";
import type { ActiveTab } from "./home-tabs";

interface FinancialSummaryProps {
  balance: ReturnType<typeof calculateBalance>;
  incomes: number;
  expenses: number;
  activeTab: ActiveTab;
}

export function FinancialSummary({
  balance,
  incomes,
  expenses,
  activeTab,
}: FinancialSummaryProps) {
  const COLORS = useThemeColors();
  const styles = getHomeStyles(COLORS);

  return (
    <>
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
              <Feather name="arrow-up-circle" size={20} color={COLORS.income} />

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
                <Text style={[styles.subCardValue, { color: COLORS.expense }]}>
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
    </>
  );
}
