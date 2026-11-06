import { View, Text, TextInput } from "react-native";
import { TransactionType } from "@/types/transaction";
import { typesLabel } from "@/utils/labels";
import { formatBRL } from "@/utils/format";
import { useThemeColors, ThemeColors } from "@/styles/theme";
import { Chip } from "./chip";

interface TransactionFormProps {
  name: string;
  setName: (value: string) => void;
  priceCents: number;
  setPriceCents: (value: number) => void;
  type: TransactionType;
  setType: (value: TransactionType) => void;
  category: string | null;
  setCategory: (value: string) => void;
  categories: string[];
  isCreatingCategory: boolean;
  onCreateCategory: () => void;
  onCategoryLongPress: (category: string) => void;
  styles: {
    label: object;
    input: object;
    chipRow: object;
  };
}

const transactionTypes = Object.keys(typesLabel) as TransactionType[];

export function TransactionForm({
  name,
  setName,
  priceCents,
  setPriceCents,
  type,
  setType,
  category,
  setCategory,
  categories,
  isCreatingCategory,
  onCreateCategory,
  onCategoryLongPress,
  styles,
}: TransactionFormProps) {
  const COLORS = useThemeColors();

  const handlePriceChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 9);
    setPriceCents(Number(digits));
  };

  return (
    <>
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

      <Text style={styles.label}>Tipo</Text>

      <View style={styles.chipRow}>
        {transactionTypes.map((transactionType) => (
          <Chip
            key={transactionType}
            label={typesLabel[transactionType]}
            selected={type === transactionType}
            onPress={() => setType(transactionType)}
          />
        ))}
      </View>

      <Text style={styles.label}>Categoria</Text>

      <View style={styles.chipRow}>
        {categories.map((categoryName) => (
          <Chip
            key={categoryName}
            label={categoryName}
            selected={category === categoryName}
            onPress={() => setCategory(categoryName)}
            onLongPress={() => onCategoryLongPress(categoryName)}
          />
        ))}

        <Chip
          label="+ Nova"
          selected={isCreatingCategory}
          onPress={onCreateCategory}
        />
      </View>
    </>
  );
}
