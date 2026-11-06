import { NewTransaction, Transaction } from "@/types/transaction";
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { CategoryModals } from "./category-modals";
import { TransactionOptions } from "./transaction-options";
import { TransactionForm } from "./transaction-form";
import { useThemeColors, ThemeColors } from "@/styles/theme";

interface TransactionModalProps {
  visible: boolean;
  categories: string[];
  onClose: () => void;
  onSave: (data: NewTransaction) => Promise<void>;
  onAddCategory: (name: string) => Promise<boolean>;
  onDeleteCategory: (name: string) => Promise<boolean>;
  onEditCategory: (
    oldCategoryName: string,
    newCategoryName: string,
  ) => Promise<boolean>;
  transactionToEdit: Transaction | null;
}

export default function TransactionModal({
  visible,
  categories,
  onClose,
  onSave,
  onAddCategory,
  onDeleteCategory,
  onEditCategory,
  transactionToEdit,
}: TransactionModalProps) {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);

  const [name, setName] = useState("");
  const [priceCents, setPriceCents] = useState(0);
  const [type, setType] = useState<Transaction["type"]>("expense");
  const [category, setCategory] = useState<string | null>(null);
  const [isFixed, setIsFixed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(true);
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState(2);

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryToEdit, setCategoryToEdit] = useState<string | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");

  const [renderModal, setRenderModal] = useState(visible);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const startSubmitting = () => {
    if (isSubmittingRef.current) return false;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    return true;
  };

  const finishSubmitting = () => {
    isSubmittingRef.current = false;
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setName("");
    setPriceCents(0);
    setType("expense");
    setCategory(null);
    setIsFixed(false);
    setIsConfirmed(true);
    setIsInstallment(false);
    setTotalInstallments(2);
    setIsCreatingCategory(false);
    setNewCategoryName("");
    setCategoryToEdit(null);
    setEditedCategoryName("");
  };

  useEffect(() => {
    if (visible) {
      setRenderModal(true);
      return;
    }

    const timer = setTimeout(() => setRenderModal(false), 300);

    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    if (!transactionToEdit) {
      resetForm();
      return;
    }

    setName(transactionToEdit.name);
    setPriceCents(transactionToEdit.price);
    setType(transactionToEdit.type);
    setCategory(transactionToEdit.category);
    setIsFixed(transactionToEdit.isFixed);
    setIsConfirmed(transactionToEdit.isConfirmed);
    setIsInstallment(transactionToEdit.installmentGroupId != null);
    setTotalInstallments(transactionToEdit.totalInstallments || 2);
    setIsCreatingCategory(false);
    setNewCategoryName("");
    setCategoryToEdit(null);
    setEditedCategoryName("");
  }, [visible, transactionToEdit]);

  const isValid = name.trim() !== "" && priceCents > 0 && category !== null;

  const handleClose = () => {
    if (isSubmittingRef.current) return;

    resetForm();
    onClose();
  };

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();

    if (!trimmed || !startSubmitting()) return;

    try {
      if (!(await onAddCategory(trimmed))) return;

      setCategory(trimmed);
      setNewCategoryName("");
      setIsCreatingCategory(false);
    } catch (error) {
      Alert.alert(
        "Erro ao criar categoria",
        error instanceof Error
          ? error.message
          : "Não foi possível criar a categoria. Tente novamente.",
      );
    } finally {
      finishSubmitting();
    }
  };

  const handleEditCategory = async () => {
    const trimmed = editedCategoryName.trim();

    if (!trimmed || !categoryToEdit || !startSubmitting()) return;

    try {
      if (!(await onEditCategory(categoryToEdit, trimmed))) return;

      if (category === categoryToEdit) {
        setCategory(trimmed);
      }

      setCategoryToEdit(null);
      setEditedCategoryName("");
    } catch (error) {
      Alert.alert(
        "Erro ao renomear categoria",
        error instanceof Error
          ? error.message
          : "Não foi possível renomear a categoria. Tente novamente.",
      );
    } finally {
      finishSubmitting();
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (!startSubmitting()) return;

    try {
      if (!(await onDeleteCategory(categoryName))) return;

      if (category === categoryName) setCategory(null);
    } catch (error) {
      Alert.alert(
        "Erro ao apagar categoria",
        error instanceof Error
          ? error.message
          : "Não foi possível apagar a categoria. Tente novamente.",
      );
    } finally {
      finishSubmitting();
    }
  };

  const handleCategoryLongPress = async (categoryName: string) => {
    if (isSubmittingRef.current) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    if (isSubmittingRef.current) return;

    Alert.alert(
      "Gerir Categoria",
      `O que pretende fazer com "${categoryName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: () => handleDeleteCategory(categoryName),
        },
        {
          text: "Renomear",
          onPress: () => {
            if (isSubmittingRef.current) return;

            setCategoryToEdit(categoryName);
            setEditedCategoryName(categoryName);
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    if (!isValid || category === null || !startSubmitting()) return;

    try {
      await onSave({
        name: name.trim(),
        price: priceCents,
        category,
        type,
        isFixed,
        isConfirmed,
        installmentNumber:
          transactionToEdit?.installmentNumber ?? (isInstallment ? 1 : undefined),
        totalInstallments: isInstallment ? totalInstallments : undefined,
        installmentGroupId: transactionToEdit?.installmentGroupId,
      });

      resetForm();
    } catch (error) {
      Alert.alert(
        "Erro ao salvar transação",
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a transação. Tente novamente.",
      );
    } finally {
      finishSubmitting();
    }
  };

  return (
    <Modal
      visible={renderModal}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      {visible && (
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(300)}
          style={styles.root}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>
                  {transactionToEdit ? "Editar transação" : "Nova Transação"}
                </Text>

                <TouchableOpacity onPress={handleClose}>
                  <Text style={styles.closeButtonText}>Fechar</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
              >
                <TransactionForm
                  name={name}
                  setName={setName}
                  priceCents={priceCents}
                  setPriceCents={setPriceCents}
                  type={type}
                  setType={setType}
                  category={category}
                  setCategory={setCategory}
                  categories={categories}
                  isCreatingCategory={isCreatingCategory}
                  onCreateCategory={() => {
                    if (!isSubmittingRef.current) setIsCreatingCategory(true);
                  }}
                  onCategoryLongPress={handleCategoryLongPress}
                  styles={styles}
                />

                <TransactionOptions
                  isFixed={isFixed}
                  setIsFixed={setIsFixed}
                  isConfirmed={isConfirmed}
                  setIsConfirmed={setIsConfirmed}
                  isInstallment={isInstallment}
                  setIsInstallment={setIsInstallment}
                  totalInstallments={totalInstallments}
                  setTotalInstallments={setTotalInstallments}
                  styles={styles}
                />

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    !isValid && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={!isValid || isSubmitting}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <CategoryModals
              isSubmitting={isSubmitting}
              isCreatingCategory={isCreatingCategory}
              newCategoryName={newCategoryName}
              setNewCategoryName={setNewCategoryName}
              onCloseCreate={() => {
                if (isSubmittingRef.current) return;

                setIsCreatingCategory(false);
                setNewCategoryName("");
              }}
              onCreate={handleCreateCategory}
              categoryToEdit={categoryToEdit}
              editedCategoryName={editedCategoryName}
              setEditedCategoryName={setEditedCategoryName}
              onCloseEdit={() => {
                if (isSubmittingRef.current) return;

                setCategoryToEdit(null);
                setEditedCategoryName("");
              }}
              onEdit={handleEditCategory}
            />
          </SafeAreaView>
        </Animated.View>
      )}
    </Modal>
  );
}

const getStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContainer: {
      flex: 1,
      backgroundColor: COLORS.background,
      marginTop: 40,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      backgroundColor: COLORS.surface,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    title: {
      fontSize: 20,
      fontFamily: "Body Bold",
      color: COLORS.text,
    },
    closeButtonText: {
      fontSize: 16,
      fontFamily: "Body SemiBold",
      color: COLORS.burgundy,
    },
    content: {
      padding: 16,
      gap: 8,
      paddingBottom: 64,
    },
    label: {
      fontSize: 14,
      fontFamily: "Body SemiBold",
      color: COLORS.text,
      marginTop: 12,
    },
    input: {
      height: 48,
      backgroundColor: COLORS.surface,
      borderColor: COLORS.border,
      borderWidth: 1,
      paddingHorizontal: 14,
      borderRadius: 12,
      fontFamily: "Body Medium",
      fontSize: 15,
      color: COLORS.text,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    switchRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 12,
    },
    switchText: {
      fontFamily: "Body Medium",
      color: COLORS.text,
      fontSize: 15,
    },
    saveButton: {
      backgroundColor: COLORS.burgundy,
      height: 52,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 24,
      shadowColor: COLORS.burgundy,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    saveButtonDisabled: {
      backgroundColor: COLORS.sage,
      shadowOpacity: 0,
      elevation: 0,
    },
    saveButtonText: {
      color: COLORS.white,
      fontSize: 16,
      fontFamily: "Body Bold",
    },
  });
