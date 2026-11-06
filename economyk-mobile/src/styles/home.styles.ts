import { StyleSheet } from "react-native";
import { ThemeColors } from "./theme";

const FONT_REGULAR = "Body Regular";
const FONT_MEDIUM = "Body Medium";
const FONT_SEMIBOLD = "Body SemiBold";
const FONT_BOLD = "Body Bold";
const FONT_DISPLAY = "Display Medium";

export const getHomeStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },

    mainContent: {
      flex: 1,
      minHeight: 0,
      width: "100%",
    },

    analyticsContainer: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: 0,
    },

    listContainer: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: 20,
    },

    topSwitchContainer: {
      flexDirection: "row",
      backgroundColor: COLORS.surfaceMuted,
      borderRadius: 14,
      marginHorizontal: 20,
      marginTop: 8,
      padding: 4,
    },

    switchButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 11,
      gap: 7,
    },

    switchButtonActive: {
      backgroundColor: COLORS.burgundy,
      shadowColor: COLORS.burgundy,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.16,
      shadowRadius: 5,
      elevation: 3,
    },

    switchText: {
      fontSize: 13,
      fontFamily: FONT_SEMIBOLD,
      color: COLORS.textSecondary,
    },

    switchTextActive: {
      color: COLORS.white,
    },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },

    monthButton: {
      padding: 8,
    },

    monthTitleContainer: {
      alignItems: "center",
    },

    monthText: {
      fontSize: 19,
      fontFamily: FONT_DISPLAY,
      color: COLORS.text,
      letterSpacing: 0.2,
    },

    yearText: {
      fontSize: 11,
      color: COLORS.textSecondary,
      fontFamily: FONT_MEDIUM,
      marginTop: 1,
    },

    dashboard: {
      paddingHorizontal: 20,
      paddingBottom: 12,
    },

    mainCard: {
      backgroundColor: COLORS.burgundy,
      paddingVertical: 24,
      paddingHorizontal: 20,
      borderRadius: 18,
      alignItems: "flex-start",
      marginBottom: 12,
      shadowColor: COLORS.burgundy,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.16,
      shadowRadius: 9,
      elevation: 4,
    },

    mainCardNegative: {
      backgroundColor: COLORS.surfaceMuted,
      shadowColor: COLORS.surfaceMuted,
    },

    cardLabelVisible: {
      color: COLORS.cream,
      fontSize: 13,
      fontFamily: FONT_MEDIUM,
      marginBottom: 7,
    },

    mainCardValue: {
      color: COLORS.white,
      fontSize: 29,
      fontFamily: FONT_BOLD,
      letterSpacing: 0.3,
    },

    subCardsRow: {
      flexDirection: "row",
      gap: 10,
    },

    subCard: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      padding: 13,
      borderRadius: 14,
      backgroundColor: COLORS.surface,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
    },

    subCardLabel: {
      fontSize: 11,
      color: COLORS.textSecondary,
      fontFamily: FONT_MEDIUM,
    },

    subCardValue: {
      fontSize: 14,
      fontFamily: FONT_BOLD,
    },

    unconfirmedAlert: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.surfaceMuted,
      marginHorizontal: 20,
      padding: 12,
      borderRadius: 12,
      marginBottom: 10,
    },

    unconfirmedText: {
      color: COLORS.warning,
      marginLeft: 8,
      fontSize: 12,
      fontWeight: "600",
    },

    filterSection: {
      paddingHorizontal: 20,
      marginBottom: 12,
    },

    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.surface,
      borderRadius: 12,
      paddingHorizontal: 13,
      height: 44,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
    },

    searchInput: {
      flex: 1,
      fontSize: 14,
      color: COLORS.text,
    },

    filterChipsRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },

    filterChip: {
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },

    filterChipSelected: {
      backgroundColor: COLORS.burgundy,
      borderColor: COLORS.burgundy,
    },

    filterChipText: {
      fontSize: 12,
      color: COLORS.textSecondary,
      fontWeight: "500",
    },

    filterChipTextSelected: {
      color: COLORS.white,
      fontWeight: "600",
    },

    categoryFilterContainer: {
      marginTop: 3,
    },

    categoryScroll: {
      gap: 7,
      paddingRight: 20,
    },

    categoryChip: {
      paddingVertical: 6,
      paddingHorizontal: 11,
      borderRadius: 10,
      backgroundColor: COLORS.surfaceMuted,
      borderWidth: 1,
      borderColor: COLORS.border,
    },

    categoryChipSelected: {
      backgroundColor: COLORS.sageDark,
      borderColor: COLORS.sageDark,
    },

    categoryChipText: {
      fontSize: 11,
      color: COLORS.text,
      fontWeight: "500",
    },

    categoryChipTextSelected: {
      color: COLORS.white,
      fontWeight: "600",
    },

    swipeWrapper: {
      marginBottom: 10,
      borderRadius: 14,
      overflow: "hidden",
    },

    backgroundActions: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: 110,
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      borderRadius: 14,
    },

    actionBtn: {
      width: 50,
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },

    transactionCard: {
      backgroundColor: COLORS.surface,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.border,
    },

    transactionInfo: {
      flex: 1,
    },

    transactionName: {
      fontSize: 15,
      fontFamily: FONT_SEMIBOLD,
      color: COLORS.text,
      marginBottom: 4,
    },

    transactionTags: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    transactionActions: {
      alignItems: "flex-end",
      justifyContent: "center",
    },

    transactionPrice: {
      fontSize: 15,
      fontFamily: FONT_BOLD,
    },

    transactionNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },

    unconfirmedDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: COLORS.warning,
      marginBottom: 2,
    },

    categoryTag: {
      fontSize: 12,
      fontFamily: FONT_MEDIUM,
      color: COLORS.text,
      backgroundColor: COLORS.surfaceMuted,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 6,
    },

    fixedBadge: {
      backgroundColor: COLORS.burgundy + "99",
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },

    fixedBadgeText: {
      fontSize: 10,
      color: COLORS.cream,
      fontWeight: "700",
    },

    installmentBadge: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },

    installmentBadgeText: {
      fontSize: 10,
      fontWeight: "700",
    },

    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
    },

    emptyStateText: {
      color: COLORS.textSecondary,
      fontFamily: FONT_MEDIUM,
      marginTop: 12,
      fontSize: 14,
    },

    fab: {
      position: "absolute",
      bottom: 80,
      right: 20,
      backgroundColor: COLORS.burgundy,
      width: 58,
      height: 58,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: COLORS.burgundy,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
  });
