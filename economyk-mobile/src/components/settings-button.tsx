import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppTheme } from "@/context/theme-context";

interface SettingsButtonProps {
  onPress: () => void;
}

export function SettingsButton({ onPress }: SettingsButtonProps) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.85}
    >
      <Feather name="settings" size={18} color={colors.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginLeft: 4,
  },
});
