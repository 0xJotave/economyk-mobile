import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { useThemeColors, ThemeColors } from "@/styles/theme";

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export function Chip({ label, selected, onPress, onLongPress }: ChipProps) {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={selected ? styles.chipTextSelected : styles.chipText}>
        {label}
      </Text>
    </Pressable>
  );
}

const getStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    chipSelected: {
      backgroundColor: COLORS.sageDark,
      borderColor: COLORS.sageDark,
    },
    chipText: {
      color: COLORS.textSecondary,
      fontFamily: "Body Medium",
    },
    chipTextSelected: {
      color: COLORS.white,
      fontFamily: "Body SemiBold",
    },
  });
