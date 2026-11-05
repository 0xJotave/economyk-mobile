import React from "react";
import { View, Text, Switch } from "react-native";
import { Chip } from "./chip";
import { useThemeColors } from "@/styles/theme";

interface TransactionOptionsProps {
  isFixed: boolean;
  setIsFixed: (val: boolean) => void;
  isConfirmed: boolean;
  setIsConfirmed: (val: boolean) => void;
  isInstallment: boolean;
  setIsInstallment: (val: boolean) => void;
  totalInstallments: number;
  setTotalInstallments: (num: number) => void;
  styles: any;
}

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

  const switchTrackColor = { false: COLORS.border, true: COLORS.burgundy };
  const switchThumbColor = COLORS.white;

  return (
    <>
      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Fixa (todo mês)</Text>
        <Switch
          trackColor={switchTrackColor}
          thumbColor={switchThumbColor}
          value={isFixed}
          onValueChange={(val) => {
            setIsFixed(val);
            if (val) setIsInstallment(false);
          }}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Valor confirmado</Text>
        <Switch
          trackColor={switchTrackColor}
          thumbColor={switchThumbColor}
          value={isConfirmed}
          onValueChange={setIsConfirmed}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Parcelado</Text>
        <Switch
          trackColor={switchTrackColor}
          thumbColor={switchThumbColor}
          value={isInstallment}
          onValueChange={(val) => {
            setIsInstallment(val);
            if (val) setIsFixed(false);
          }}
        />
      </View>

      {isInstallment && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.label}>
            Número de Parcelas ({totalInstallments}x)
          </Text>
          <View style={styles.chipRow}>
            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
              <Chip
                key={num}
                label={`${num}x`}
                selected={totalInstallments === num}
                onPress={() => setTotalInstallments(num)}
              />
            ))}
          </View>
        </View>
      )}
    </>
  );
}
