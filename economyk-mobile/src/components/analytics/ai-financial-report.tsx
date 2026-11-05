import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  FinancialReportError,
  generateFinancialReport,
  type FinancialReportInput,
} from "@/services/financial-report";

import {
  getStoredFinancialReport,
  saveFinancialReport,
  type StoredFinancialReport,
} from "@/services/financial-report-storage";

import { useThemeColors, ThemeColors } from "@/styles/theme";

interface AIFinancialReportProps {
  data: FinancialReportInput;
}

const COOLDOWN_MS = 180_000;

function renderInline(
  text: string,
  keyPrefix: string,
  styles: any,
): ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={key} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <Text key={key} style={styles.italic}>
          {part.slice(1, -1)}
        </Text>
      );
    }

    return <Text key={key}>{part}</Text>;
  });
}

function FormattedReport({
  content,
  styles,
}: {
  content: string;
  styles: any;
}) {
  const lines = content.split("\n");

  return (
    <View>
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        const key = `line-${index}`;

        if (!trimmedLine) {
          return <View key={key} style={styles.lineSpacing} />;
        }

        if (/^---+$/.test(trimmedLine)) {
          return <View key={key} style={styles.separator} />;
        }

        const heading = trimmedLine.match(/^(#{1,6})\s+(.+)$/);

        if (heading) {
          const level = heading[1].length;

          return (
            <Text
              key={key}
              style={[
                styles.paragraph,
                level === 1
                  ? styles.heading1
                  : level === 2
                    ? styles.heading2
                    : styles.heading3,
              ]}
            >
              {renderInline(heading[2], key, styles)}
            </Text>
          );
        }

        const bullet = trimmedLine.match(/^[-*]\s+(.+)$/);

        if (bullet) {
          return (
            <View key={key} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraphContent}>
                {renderInline(bullet[1], key, styles)}
              </Text>
            </View>
          );
        }

        const numbered = trimmedLine.match(/^(\d+)\.\s+(.+)$/);

        if (numbered) {
          return (
            <View key={key} style={styles.listItem}>
              <Text style={styles.number}>{numbered[1]}.</Text>
              <Text style={styles.paragraphContent}>
                {renderInline(numbered[2], key, styles)}
              </Text>
            </View>
          );
        }

        return (
          <Text key={key} style={styles.paragraph}>
            {renderInline(trimmedLine, key, styles)}
          </Text>
        );
      })}
    </View>
  );
}

export function AIFinancialReport({ data }: AIFinancialReportProps) {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);

  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStoredReport, setLoadingStoredReport] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setTimeout(() => {
      setCooldown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    let active = true;

    setReport(null);
    setCooldown(0);
    setLoadingStoredReport(true);
    setError(null);

    getStoredFinancialReport(data.month)
      .then((storedReport: StoredFinancialReport | null) => {
        if (!active) return;

        setReport(storedReport?.report ?? null);

        if (storedReport) {
          const elapsed = Date.now() - storedReport.generatedAt;
          const remaining = Math.max(
            0,
            Math.ceil((COOLDOWN_MS - elapsed) / 1000),
          );

          setCooldown(remaining);
        }
      })
      .catch(() => {
        if (active) {
          setError("Não foi possível recuperar o relatório salvo.");
        }
      })
      .finally(() => {
        if (active) {
          setLoadingStoredReport(false);
        }
      });

    return () => {
      active = false;
    };
  }, [data.month]);

  async function handleGenerateReport() {
    if (loading || loadingStoredReport || cooldown > 0) return;

    setLoading(true);
    setError(null);

    let result: string;

    try {
      result = await generateFinancialReport(data);
    } catch (err) {
      if (err instanceof FinancialReportError) {
        setError(err.message);
        setCooldown(err.retryAfterSeconds ?? 0);
      } else {
        setError("Não foi possível gerar o relatório financeiro.");
      }

      setLoading(false);
      return;
    }

    setReport(result);
    setCooldown(180);
    setLoading(false);

    try {
      await saveFinancialReport(data.month, result);
    } catch {
      setError(
        "O relatório foi gerado, mas não foi possível salvá-lo no dispositivo.",
      );
    }
  }

  const buttonDisabled = loading || loadingStoredReport || cooldown > 0;

  function renderButtonText() {
    if (loading) return null;

    if (cooldown > 0) {
      return `Novo relatório em ${cooldown}s`;
    }

    return report ? "Gerar novo relatório" : "Gerar relatório";
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>✨ Análise com IA</Text>
        <Text style={styles.description}>
          Receba uma análise personalizada dos seus gastos e oportunidades de
          economia.
        </Text>
      </View>

      {loadingStoredReport && <ActivityIndicator color={COLORS.burgundy} />}

      {!loadingStoredReport && !report && (
        <TouchableOpacity
          style={[styles.button, buttonDisabled && styles.disabled]}
          onPress={handleGenerateReport}
          disabled={buttonDisabled}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>{renderButtonText()}</Text>
          )}
        </TouchableOpacity>
      )}

      {loading && (
        <Text style={styles.loadingText}>
          Analisando suas finanças... Isso pode levar alguns segundos.
        </Text>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {report && (
        <View style={styles.reportContainer}>
          <Text style={styles.reportTitle}>Seu relatório</Text>
          <FormattedReport content={report} styles={styles} />
          <TouchableOpacity
            style={[styles.button, buttonDisabled && styles.disabled]}
            onPress={handleGenerateReport}
            disabled={buttonDisabled}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>{renderButtonText()}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const getStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: COLORS.surface,
      borderRadius: 16,
      padding: 16,
      marginTop: 8,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
    },
    header: { marginBottom: 16 },
    title: {
      fontSize: 18,
      fontFamily: "Display Medium",
      color: COLORS.text,
      marginBottom: 8,
    },
    description: {
      fontSize: 13,
      fontFamily: "Body Regular",
      color: COLORS.textSecondary,
      lineHeight: 19,
    },
    button: {
      backgroundColor: COLORS.burgundy,
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    disabled: { opacity: 0.5 },
    buttonText: {
      color: COLORS.white,
      fontSize: 14,
      fontFamily: "Body SemiBold",
    },
    loadingText: {
      marginTop: 12,
      color: COLORS.textSecondary,
      fontFamily: "Body Medium",
      fontSize: 13,
      textAlign: "center",
    },
    errorText: { marginTop: 12, color: COLORS.expense, fontSize: 13 },
    reportContainer: {
      marginTop: 16,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
      paddingTop: 16,
    },
    reportTitle: {
      fontSize: 16,
      fontFamily: "Display Medium",
      color: COLORS.text,
      marginBottom: 12,
    },
    paragraph: {
      fontSize: 14,
      fontFamily: "Body Regular",
      color: COLORS.text,
      lineHeight: 23,
      marginBottom: 10,
    },
    paragraphContent: {
      flex: 1,
      fontSize: 14,
      fontFamily: "Body Regular",
      color: COLORS.text,
      lineHeight: 23,
    },
    heading1: {
      fontSize: 21,
      fontFamily: "Display Medium",
      color: COLORS.text,
      marginTop: 16,
      marginBottom: 10,
    },
    heading2: {
      fontSize: 18,
      fontFamily: "Display Medium",
      color: COLORS.text,
      marginTop: 14,
      marginBottom: 8,
    },
    heading3: {
      fontSize: 16,
      fontFamily: "Display Medium",
      color: COLORS.text,
      marginTop: 12,
      marginBottom: 6,
    },
    bold: { fontFamily: "Body Bold", color: COLORS.text },
    italic: { fontStyle: "italic" },
    listItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 8,
      paddingLeft: 4,
    },
    bullet: {
      fontSize: 16,
      fontFamily: "Body Bold",
      color: COLORS.burgundy,
      marginRight: 10,
      lineHeight: 23,
    },
    number: {
      fontSize: 14,
      fontFamily: "Body Bold",
      color: COLORS.burgundy,
      marginRight: 10,
      lineHeight: 23,
    },
    separator: {
      height: 1,
      backgroundColor: COLORS.border,
      marginVertical: 12,
    },
    lineSpacing: { height: 6 },
  });
