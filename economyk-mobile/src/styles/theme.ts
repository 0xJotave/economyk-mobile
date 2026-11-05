import { useAppTheme } from "@/context/theme-context";

export const LIGHT_COLORS = {
  background: "#F3EEE7",
  surface: "#FFFCF7",
  surfaceMuted: "#EAE5DC",
  sage: "#A5A79B",
  sageDark: "#687064",
  cream: "#E8D2B5",
  burgundy: "#590907",
  burgundyLight: "#7A2925",
  text: "#292622",
  textSecondary: "#77736C",
  border: "#DED7CC",
  white: "#FFFFFF",
  income: "#64765B",
  expense: "#8A302B",
  warning: "#A66B32",
};

export const DARK_COLORS = {
  background: "#141110",
  surface: "#201B18",
  surfaceMuted: "#2D2623",
  sage: "#727768",
  sageDark: "#A3A899",
  cream: "#D4BC9B",
  burgundy: "#7A1D18",
  burgundyLight: "#9E2E28",
  text: "#F0ECE6",
  textSecondary: "#A8A096",
  border: "#362F2B",
  white: "#FFFFFF",
  income: "#85AB78",
  expense: "#E06D65",
  warning: "#E09F5B",
};

export type ThemeColors = typeof LIGHT_COLORS;

// Usa o hook do contexto global para alternar com o botão animado
export function useThemeColors(): ThemeColors {
  const { colors } = useAppTheme();
  return colors;
}
