import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { AppState } from "react-native";
import { useEffect } from "react";

import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";

import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import { ThemeProvider, useAppTheme } from "@/context/theme-context";
import { wakeUpApi } from "@/services/api-wakeup";

SplashScreen.preventAutoHideAsync();

function MainContent() {
  const { isDark } = useAppTheme();

  const [fontsLoaded] = useFonts({
    "Display Medium": Fraunces_500Medium,
    "Display SemiBold": Fraunces_600SemiBold,
    "Display Bold": Fraunces_700Bold,

    "Body Regular": Manrope_400Regular,
    "Body Medium": Manrope_500Medium,
    "Body SemiBold": Manrope_600SemiBold,
    "Body Bold": Manrope_700Bold,
  });

  useEffect(() => {
    wakeUpApi();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        wakeUpApi();
      }
    });

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </NavigationThemeProvider>
  );
}

export default function TabLayout() {
  return (
    <ThemeProvider>
      <MainContent />
    </ThemeProvider>
  );
}
