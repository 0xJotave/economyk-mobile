import { View, Text, Switch } from "react-native";
import type { ViewStyle, TextStyle } from "react-native";
import { Chip } from "./chip";
import { useThemeColors } from "@/styles/theme";

interface TransactionOptionsProps {
  isFixed: boolean;
  setIsFixed: (value: boolean) => void;
  isConfirmed: boolean;
  setIsConfirmed: (value: boolean) => void;
  isInstallment: boolean;
  setIsInstallment: (value: boolean) => void;
  totalInstallments: number;
  setTotalInstallments: (value: number) => void;
  styles: {
    switchRow: ViewStyle;
    switchText: TextStyle;
    label: TextStyle;
    chipRow: ViewStyle;
  };
}

const INSTALLMENT_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function TransactionOptions({
  isFixed,
  setIsFixed,
  isConfirmed,
  setIsConfirmed,
  isInstallment,
  setIsInstallment,
  totalInstallments,
  setTotalInstallments,
  styles,
}: TransactionOptionsProps) {
  const COLORS = useThemeColors();

  const switchTrackColor = {
    false: COLORS.border,
    true: COLORS.burgundy,
  };

  const handleFixedChange = (value: boolean) => {
    setIsFixed(value);

    if (value) setIsInstallment(false);
  };

  const handleInstallmentChange = (value: boolean) => {
    setIsInstallment(value);

    if (value) setIsFixed(false);
  };

  return (
    <>
      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Fixa (todo mês)</Text>
        <Switch
          trackColor={switchTrackColor}
          thumbColor={COLORS.white}
          value={isFixed}
          onValueChange={handleFixedChange}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Valor confirmado</Text>
        <Switch
          trackColor={switchTrackColor}
          thumbColor={COLORS.white}
          value={isConfirmed}
          onValueChange={setIsConfirmed}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Parcelado</Text>
        <Switch
          trackColor={switchTrackColor}
          thumbColor={COLORS.white}
          value={isInstallment}
          onValueChange={handleInstallmentChange}
        />
      </View>

      {isInstallment && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.label}>
            Número de Parcelas ({totalInstallments}x)
          </Text>

          <View style={styles.chipRow}>
            {INSTALLMENT_OPTIONS.map((number) => (
              <Chip
                key={number}
                label={`${number}x`}
                selected={totalInstallments === number}
                onPress={() => setTotalInstallments(number)}
              />
            ))}
          </View>
        </View>
      )}
    </>
  );
}
