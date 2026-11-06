import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getHomeStyles } from "@/styles/home.styles";
import { useThemeColors } from "@/styles/theme";

interface MonthNavigationProps {
  month: string;
  isChangingMonth: boolean;
  onChangeMonth: (step: 1 | -1) => void;
}

const MONTHS = [
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

export function MonthNavigation({
  month,
  isChangingMonth,
  onChangeMonth,
}: MonthNavigationProps) {
  const COLORS = useThemeColors();
  const styles = getHomeStyles(COLORS);

  const [year, monthNumber] = month.split("-");
  const monthName = MONTHS[Number(monthNumber)] || "Mês";

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => onChangeMonth(-1)}
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
        <Text style={styles.monthText}>{monthName}</Text>
        <Text style={styles.yearText}>{`${monthNumber}-${year}`}</Text>
      </View>

      <TouchableOpacity
        onPress={() => onChangeMonth(1)}
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
  );
}
