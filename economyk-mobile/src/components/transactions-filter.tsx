import React from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Text,
  StyleSheet,
} from "react-native";
import { useThemeColors, ThemeColors } from "@/styles/theme";

type FilterType = "all" | "income" | "expense";

interface TransactionsFilterProps {
  selectedFilter: FilterType;
  setSelectedFilter: (filter: FilterType) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string) => void;
  categories: string[];
}

export function TransactionsFilter({
  selectedFilter,
  setSelectedFilter,
  selectedCategory,
  setSelectedCategory,
  categories,
}: TransactionsFilterProps) {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);

  return (
    <View style={styles.filterSection}>
      {/* FILTROS POR TIPO */}
      <View style={styles.filterChipsRow}>
        {(["all", "income", "expense"] as FilterType[]).map((type) => {
          const labels = {
            all: "Todas",
            income: "Receitas",
            expense: "Despesas",
          };
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                selectedFilter === type && styles.filterChipSelected,
              ]}
              onPress={() => setSelectedFilter(type)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === type && styles.filterChipTextSelected,
                ]}
              >
                {labels[type]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* FILTROS POR CATEGORIA */}
      <View style={styles.categoryFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              (selectedCategory === "Todas" || selectedCategory === null) &&
                styles.categoryChipSelected,
            ]}
            onPress={() => setSelectedCategory("Todas")}
          >
            <Text
              style={[
                styles.categoryChipText,
                (selectedCategory === "Todas" || selectedCategory === null) &&
                  styles.categoryChipTextSelected,
              ]}
            >
              🏷️ Todas
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextSelected,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const getStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    filterSection: {
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    filterChipsRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    filterChip: {
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    filterChipSelected: {
      backgroundColor: COLORS.burgundy,
      borderColor: COLORS.burgundy,
    },
    filterChipText: {
      fontSize: 12,
      fontFamily: "Body Medium",
      color: COLORS.textSecondary,
    },
    filterChipTextSelected: {
      color: COLORS.white,
      fontFamily: "Body SemiBold",
    },
    categoryFilterContainer: {
      marginTop: 3,
    },
    categoryScroll: {
      gap: 7,
      paddingRight: 20,
    },
    categoryChip: {
      paddingVertical: 6,
      paddingHorizontal: 11,
      borderRadius: 10,
      backgroundColor: COLORS.surfaceMuted,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    categoryChipSelected: {
      backgroundColor: COLORS.sageDark,
      borderColor: COLORS.sageDark,
    },
    categoryChipText: {
      fontSize: 11,
      fontFamily: "Body Medium",
      color: COLORS.text,
    },
    categoryChipTextSelected: {
      color: COLORS.white,
      fontFamily: "Body SemiBold",
    },
  });
