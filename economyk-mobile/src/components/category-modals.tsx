import {
  View,
  TextInput,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useThemeColors, ThemeColors } from "@/styles/theme";

interface CategoryModalsProps {
  isSubmitting: boolean;
  isCreatingCategory: boolean;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  onCloseCreate: () => void;
  onCreate: () => void;

  categoryToEdit: string | null;
  editedCategoryName: string;
  setEditedCategoryName: (name: string) => void;
  onCloseEdit: () => void;
  onEdit: () => void;
}

export function CategoryModals({
  isSubmitting,
  isCreatingCategory,
  newCategoryName,
  setNewCategoryName,
  onCloseCreate,
  onCreate,
  categoryToEdit,
  editedCategoryName,
  setEditedCategoryName,
  onCloseEdit,
  onEdit,
}: CategoryModalsProps) {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);

  return (
    <>
      {isCreatingCategory && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.overlay}
        >
          <KeyboardAvoidingView
            behavior="padding"
            style={styles.overlayKeyboard}
          >
            <View style={styles.popup}>
              <Text style={styles.popupTitle}>Nova Categoria</Text>

              <TextInput
                style={styles.input}
                placeholder="Nome da categoria"
                placeholderTextColor={COLORS.textSecondary}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                maxLength={30}
                autoFocus
              />

              <View style={styles.popupActions}>
                <TouchableOpacity
                  onPress={onCloseCreate}
                  disabled={isSubmitting}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    newCategoryName.trim() === "" && styles.saveBtnDisabled,
                  ]}
                  onPress={onCreate}
                  disabled={newCategoryName.trim() === "" || isSubmitting}
                >
                  <Text style={styles.saveBtnText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}

      {categoryToEdit && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.overlay}
        >
          <KeyboardAvoidingView
            behavior="padding"
            style={styles.overlayKeyboard}
          >
            <View style={styles.popup}>
              <Text style={styles.popupTitle}>Renomear Categoria</Text>

              <TextInput
                style={styles.input}
                placeholder="Novo nome"
                placeholderTextColor={COLORS.textSecondary}
                value={editedCategoryName}
                onChangeText={setEditedCategoryName}
                maxLength={30}
                autoFocus
              />

              <View style={styles.popupActions}>
                <TouchableOpacity
                  onPress={onCloseEdit}
                  disabled={isSubmitting}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    editedCategoryName.trim() === "" && styles.saveBtnDisabled,
                  ]}
                  onPress={onEdit}
                  disabled={editedCategoryName.trim() === "" || isSubmitting}
                >
                  <Text style={styles.saveBtnText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </>
  );
}

const getStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 10,
    },
    overlayKeyboard: {
      flex: 1,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    popup: {
      backgroundColor: COLORS.surface,
      padding: 24,
      borderRadius: 18,
      width: "85%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    popupTitle: {
      fontSize: 18,
      fontFamily: "Display SemiBold",
      color: COLORS.text,
      marginBottom: 16,
    },
    input: {
      height: 48,
      backgroundColor: COLORS.background,
      borderColor: COLORS.border,
      borderWidth: 1,
      paddingHorizontal: 14,
      borderRadius: 12,
      fontFamily: "Body Medium",
      fontSize: 15,
      color: COLORS.text,
    },
    popupActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 24,
      gap: 8,
    },
    cancelBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      justifyContent: "center",
    },
    cancelBtnText: {
      color: COLORS.textSecondary,
      fontFamily: "Body SemiBold",
      fontSize: 15,
    },
    saveBtn: {
      backgroundColor: COLORS.burgundy,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
      justifyContent: "center",
    },
    saveBtnDisabled: {
      backgroundColor: COLORS.sage,
    },
    saveBtnText: {
      color: COLORS.white,
      fontFamily: "Body SemiBold",
      fontSize: 15,
    },
  });
