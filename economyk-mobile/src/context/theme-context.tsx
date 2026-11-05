import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LIGHT_COLORS, DARK_COLORS, ThemeColors } from "@/styles/theme";

const THEME_STORAGE_KEY = "@economyk/theme";

interface ThemeContextData {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();

  const [isDark, setIsDark] = useState(systemScheme === "dark");

  useEffect(() => {
    let isMounted = true;

    async function loadTheme() {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (!isMounted) return;

        if (savedTheme === "dark") {
          setIsDark(true);
        } else if (savedTheme === "light") {
          setIsDark(false);
        } else {
          setIsDark(systemScheme === "dark");
        }
      } catch (error) {
        console.error("Erro ao carregar tema:", error);
      }
    }

    loadTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleTheme = () => {
    setIsDark((previous) => {
      const next = !previous;

      AsyncStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light").catch(
        (error) => {
          console.error("Erro ao salvar tema:", error);
        },
      );

      return next;
    });
  };

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
