import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getHomeStyles } from "@/styles/home.styles";
import { useThemeColors } from "@/styles/theme";
import { SettingsButton } from "./settings-button";

export type ActiveTab = "transactions" | "analytics";
export type FilterType = "all" | "income" | "expense";

interface HomeTabsProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
}

export function HomeTabs({
  activeTab,
  onChangeTab,
  onOpenSettings,
}: HomeTabsProps) {
  const COLORS = useThemeColors();
  const styles = getHomeStyles(COLORS);

  return (
    <View style={styles.topSwitchContainer}>
      <TouchableOpacity
        style={[
          styles.switchButton,
          activeTab === "transactions" && styles.switchButtonActive,
        ]}
        onPress={() => onChangeTab("transactions")}
      >
        <Feather
          name="list"
          size={16}
          color={
            activeTab === "transactions" ? COLORS.white : COLORS.textSecondary
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
        onPress={() => onChangeTab("analytics")}
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

      <SettingsButton onPress={onOpenSettings} />
    </View>
  );
}
