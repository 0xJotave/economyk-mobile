import {
  NewTransaction,
  Transaction,
  TransactionType,
} from "@/types/transaction";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  SafeAreaView,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { typesLabel } from "@/utils/labels";
import { formatBRL } from "@/utils/format";
import * as Haptics from "expo-haptics";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { CategoryModals } from "./category-modals";
import { Chip } from "./chip";
import { TransactionOptions } from "./transaction-options";
import { useThemeColors, ThemeColors } from "@/styles/theme";

interface TransactionModalProps {
  visible: boolean;
  categories: string[];
  onClose: () => void;
  onSave: (data: NewTransaction) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
  onEditCategory: (oldCategoryName: string, newCategoryName: string) => void;
  transactionToEdit: Transaction | null;
}

const transactionTypes = Object.keys(typesLabel) as TransactionType[];

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

  const [name, setName] = useState<string>("");
  const [priceCents, setPriceCents] = useState<number>(0);
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState<string | null>(null);
  const [isFixed, setIsFixed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(true);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryToEdit, setCategoryToEdit] = useState<string | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState<number>(2);

  const [renderModal, setRenderModal] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRenderModal(true);
    } else {
      const timer = setTimeout(() => setRenderModal(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const isPriceValid = priceCents > 0;
  const isValid = name.trim() !== "" && isPriceValid && category !== null;

  const handlePriceChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 9);
    setPriceCents(Number(digits));
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
  };

  useEffect(() => {
    if (!visible) return;
    if (transactionToEdit) {
      setName(transactionToEdit.name);
      setPriceCents(transactionToEdit.price);
      setType(transactionToEdit.type);
      setCategory(transactionToEdit.category);
      setIsFixed(transactionToEdit.isFixed);
      setIsConfirmed(transactionToEdit.isConfirmed);

      const isAlreadyInstallment = !!transactionToEdit.installmentGroupId;
      setIsInstallment(isAlreadyInstallment);
      setTotalInstallments(transactionToEdit.totalInstallments || 2);

      setIsCreatingCategory(false);
      setNewCategoryName("");
    } else {
      resetForm();
    }
  }, [visible, transactionToEdit]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreateCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed === "") return;
    const existing = categories.find(
      (c) => c.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) {
      setCategory(existing);
    } else {
      onAddCategory(trimmed);
      setCategory(trimmed);
    }
    setNewCategoryName("");
    setIsCreatingCategory(false);
  };

  const handleSave = () => {
    if (!isValid || category === null) return;
    onSave({
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
  };

  const handleCategoryLongPress = async (categoryName: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.log("Haptics não suportado neste ambiente", error);
    }

    Alert.alert(
      "Gerir Categoria",
      `O que pretende fazer com "${categoryName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: () => {
            if (category === categoryName) setCategory(null);
            onDeleteCategory(categoryName);
          },
        },
        {
          text: "Renomear",
          onPress: () => {
            setCategoryToEdit(categoryName);
            setEditedCategoryName(categoryName);
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={renderModal}
      transparent={true}
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
                  {transactionToEdit != null
                    ? "Editar transação"
                    : "Nova Transação"}
                </Text>
                <TouchableOpacity onPress={handleClose}>
                  <Text style={styles.closeButtonText}>Fechar</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.label}>Nome</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Supermercado"
                  placeholderTextColor={COLORS.textSecondary}
                  value={name}
                  onChangeText={setName}
                  maxLength={40}
                />

                <Text style={styles.label}>Valor (R$)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0,00"
                  placeholderTextColor={COLORS.textSecondary}
                  value={priceCents === 0 ? "" : formatBRL(priceCents / 100)}
                  onChangeText={handlePriceChange}
                  keyboardType="number-pad"
                />
                {priceCents !== 0 && !isPriceValid && (
                  <Text style={styles.error}>
                    Digite um valor maior que zero
                  </Text>
                )}

                <Text style={styles.label}>Tipo</Text>
                <View style={styles.chipRow}>
                  {transactionTypes.map((t) => (
                    <Chip
                      key={t}
                      label={typesLabel[t]}
                      selected={type === t}
                      onPress={() => setType(t)}
                    />
                  ))}
                </View>

                <Text style={styles.label}>Categoria</Text>
                <View style={styles.chipRow}>
                  {categories.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      selected={category === c}
                      onPress={() => setCategory(c)}
                      onLongPress={() => handleCategoryLongPress(c)}
                    />
                  ))}
                  <Chip
                    label="+ Nova"
                    selected={isCreatingCategory}
                    onPress={() => setIsCreatingCategory(true)}
                  />
                </View>

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
                  disabled={!isValid}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <CategoryModals
              isCreatingCategory={isCreatingCategory}
              newCategoryName={newCategoryName}
              setNewCategoryName={setNewCategoryName}
              onCloseCreate={() => {
                setIsCreatingCategory(false);
                newCategoryName !== "" && setNewCategoryName("");
              }}
              onCreate={handleCreateCategory}
              categoryToEdit={categoryToEdit}
              editedCategoryName={editedCategoryName}
              setEditedCategoryName={setEditedCategoryName}
              onCloseEdit={() => setCategoryToEdit(null)}
              onEdit={() => {
                if (editedCategoryName.trim() && categoryToEdit) {
                  onEditCategory(categoryToEdit, editedCategoryName.trim());
                  if (category === categoryToEdit)
                    setCategory(editedCategoryName.trim());
                }
                setCategoryToEdit(null);
              }}
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
    error: {
      color: COLORS.expense,
      fontSize: 12,
      fontFamily: "Body Medium",
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
