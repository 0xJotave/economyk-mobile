import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Transaction } from "@/types/transaction";
import { formatBRL } from "@/utils/format";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { getHomeStyles } from "@/styles/home.styles";
import { useThemeColors } from "@/styles/theme";
import { getInstallmentColor } from "@/utils/installments";

interface TransactionItemProps {
  item: Transaction;
  onEdit: (t: Transaction) => void;
  onDelete: (id: number) => void;
}

export function TransactionItem({
  item,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const COLORS = useThemeColors();
  const styles = getHomeStyles(COLORS);

  const X = useSharedValue(0);
  const BUTTON_WIDTH = 110;

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((event) => {
      if (event.translationX < 0) {
        X.value = Math.max(event.translationX, -BUTTON_WIDTH);
      } else {
        X.value = 0;
      }
    })
    .onEnd((event) => {
      if (event.translationX < -50) {
        X.value = withSpring(-BUTTON_WIDTH, { damping: 35, stiffness: 300 });
      } else {
        X.value = withSpring(0, { damping: 35, stiffness: 300 });
      }
    });

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: X.value }],
  }));

  const isIncome = item.type === "income";

  return (
    <View style={styles.swipeWrapper}>
      <View style={styles.backgroundActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.warning }]}
          onPress={() => {
            X.value = withSpring(0);
            onEdit(item);
          }}
        >
          <Feather name="edit-2" size={18} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.expense }]}
          onPress={() => {
            X.value = withSpring(0);
            onDelete(item.id);
          }}
        >
          <Feather name="trash-2" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.transactionCard, rStyle]}>
          <View style={styles.transactionInfo}>
            <View style={styles.transactionNameRow}>
              <Text style={styles.transactionName}>{item.name}</Text>
              {!item.isConfirmed && <View style={styles.unconfirmedDot} />}
            </View>

            <View style={styles.transactionTags}>
              <Text style={styles.categoryTag}>{item.category}</Text>

              {item.installmentNumber &&
                item.totalInstallments &&
                (() => {
                  const colors = getInstallmentColor(
                    item.installmentNumber,
                    item.totalInstallments,
                  );
                  return (
                    <View
                      style={[
                        styles.installmentBadge,
                        { backgroundColor: colors.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.installmentBadgeText,
                          { color: colors.text },
                        ]}
                      >
                        {item.installmentNumber}/{item.totalInstallments}
                      </Text>
                    </View>
                  );
                })()}

              {item.isFixed && (
                <View style={styles.fixedBadge}>
                  <Text style={styles.fixedBadgeText}>Fixo</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.transactionActions}>
            <Text
              style={[
                styles.transactionPrice,
                { color: isIncome ? COLORS.income : COLORS.text },
              ]}
            >
              {isIncome ? "+" : "-"} {formatBRL(item.price / 100)}
            </Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
