import {
  View,
  TouchableOpacity,
  ScrollView,
  Text,
  StyleSheet,
} from "react-native";
import { useThemeColors } from "@/styles/theme";
import type { ThemeColors } from "@/styles/theme";
import type { FilterType } from "./home-tabs";

const FILTER_OPTIONS: { type: FilterType; label: string }[] = [
  { type: "all", label: "Todas" },
  { type: "income", label: "Receitas" },
  { type: "expense", label: "Despesas" },
];

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

  const isAllCategories =
    selectedCategory === "Todas" || selectedCategory === null;

  return (
    <View style={styles.filterSection}>
      <View style={styles.filterChipsRow}>
        {FILTER_OPTIONS.map(({ type, label }) => (
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
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
              isAllCategories && styles.categoryChipSelected,
            ]}
            onPress={() => setSelectedCategory("Todas")}
          >
            <Text
              style={[
                styles.categoryChipText,
                isAllCategories && styles.categoryChipTextSelected,
              ]}
            >
              🏷️ Todas
            </Text>
          </TouchableOpacity>

          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category &&
                    styles.categoryChipTextSelected,
                ]}
              >
                {category}
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
