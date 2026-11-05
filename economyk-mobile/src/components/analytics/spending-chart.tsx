import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle, G } from "react-native-svg";
import { formatBRL } from "@/utils/format";
import { useThemeColors, ThemeColors } from "@/styles/theme";

interface SpendingChartProps {
  sortedCategories: [string, number][];
  totalExpense: number;
  categoryColors: string[];
}

export function SpendingChart({
  sortedCategories,
  totalExpense,
  categoryColors,
}: SpendingChartProps) {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);

  const size = 160;
  const strokeWidth = 22;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.sectionTitle}>Distribuição de Gastos</Text>

      {sortedCategories.length === 0 ? (
        <View style={styles.emptyChart}>
          <Feather name="pie-chart" size={48} color={COLORS.border} />
          <Text style={styles.emptyStateText}>Sem despesas no mês</Text>
        </View>
      ) : (
        <View style={styles.chartWrapper}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <G rotation="-90" origin={`${center}, ${center}`}>
              {sortedCategories.map(([category, amount], index) => {
                const percentage = totalExpense > 0 ? amount / totalExpense : 0;
                const color = categoryColors[index % categoryColors.length];

                const strokeLength = percentage * circumference;
                const dashArray = `${strokeLength} ${circumference}`;
                const currentOffset = -accumulatedPercent * circumference;

                accumulatedPercent += percentage;

                return (
                  <Circle
                    key={category}
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    strokeDashoffset={currentOffset}
                    fill="transparent"
                    strokeLinecap="butt"
                  />
                );
              })}
            </G>
          </Svg>

          <View style={styles.chartCenterText}>
            <Text style={styles.chartCenterLabel}>Saídas</Text>
            <Text style={styles.chartCenterValue}>
              {formatBRL(totalExpense / 100)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const getStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    chartContainer: {
      backgroundColor: COLORS.surface,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: "Display Medium",
      color: COLORS.text,
      marginBottom: 12,
    },
    emptyChart: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 30,
    },
    emptyStateText: {
      color: COLORS.textSecondary,
      fontFamily: "Body Medium",
      marginTop: 8,
      fontSize: 13,
    },
    chartWrapper: {
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 10,
      height: 160,
      width: 160,
    },
    chartCenterText: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
    },
    chartCenterLabel: {
      fontSize: 12,
      fontFamily: "Body Medium",
      color: COLORS.textSecondary,
    },
    chartCenterValue: {
      fontSize: 16,
      fontFamily: "Body Bold",
      color: COLORS.text,
    },
  });
