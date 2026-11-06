import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppTheme } from "@/context/theme-context";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onBackup: () => void;
  onRestore: () => void;
}

export function SettingsModal({
  visible,
  onClose,
  onBackup,
  onRestore,
}: SettingsModalProps) {
  const { isDark, toggleTheme, colors } = useAppTheme();
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animation, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      damping: 22,
      stiffness: 180,
    }).start();
  }, [visible, animation]);

  const modalStyle = {
    opacity: animation,
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [35, 0],
        }),
      },
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };

  const styles = createStyles(colors);

  const SettingOption = ({
    icon,
    title,
    description,
    onPress,
  }: {
    icon: keyof typeof Feather.glyphMap;
    title: string;
    description: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={styles.option}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.optionIcon}>
        <Feather name={icon} size={20} color={colors.burgundyLight} />
      </View>

      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>

      <Feather name="chevron-right" size={19} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View style={[styles.modal, modalStyle]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Configurações</Text>
              <Text style={styles.subtitle}>Personalize seu EconomyK</Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DADOS</Text>

            <SettingOption
              icon="download"
              title="Fazer backup"
              description="Exporte seus dados para um arquivo"
              onPress={onBackup}
            />

            <View style={styles.divider} />

            <SettingOption
              icon="upload"
              title="Restaurar backup"
              description="Recupere seus dados de um arquivo"
              onPress={onRestore}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>APARÊNCIA</Text>

            <TouchableOpacity
              style={styles.option}
              onPress={toggleTheme}
              activeOpacity={0.75}
            >
              <View style={styles.optionIcon}>
                <Feather
                  name={isDark ? "moon" : "sun"}
                  size={20}
                  color={colors.burgundyLight}
                />
              </View>

              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Tema</Text>
                <Text style={styles.optionDescription}>
                  {isDark ? "Modo escuro" : "Modo claro"}
                </Text>
              </View>

              <View style={styles.themeBadge}>
                <Text style={styles.themeBadgeText}>
                  {isDark ? "Escuro" : "Claro"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>EconomyK · Configurações</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modal: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 22,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 28,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    section: {
      marginBottom: 22,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.2,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    option: {
      minHeight: 66,
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      paddingVertical: 9,
    },
    optionIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    optionContent: {
      flex: 1,
      gap: 4,
    },
    optionTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    optionDescription: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 55,
    },
    themeBadge: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 9,
      backgroundColor: colors.surfaceMuted,
    },
    themeBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    footer: {
      textAlign: "center",
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
}
