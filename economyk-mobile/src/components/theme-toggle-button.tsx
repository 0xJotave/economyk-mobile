import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useAppTheme } from "@/context/theme-context";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// <-- Certifica-te de que tem o "export" aqui:
export function ThemeToggleButton() {
  const { isDark, toggleTheme, colors } = useAppTheme();

  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.85, { damping: 10, stiffness: 300 }, () => {
      scale.value = withSpring(1);
    });

    rotation.value = withSpring(rotation.value + 180, { damping: 12 });

    toggleTheme();
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      style={[
        styles.button,
        { backgroundColor: colors.surface, borderColor: colors.border },
        animatedStyle,
      ]}
      activeOpacity={0.9}
    >
      <Feather
        name={isDark ? "moon" : "sun"}
        size={18}
        color={isDark ? colors.warning : colors.burgundy}
      />
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
