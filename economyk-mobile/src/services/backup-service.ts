import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { sqlite } from "@/db";

const BACKUP_VERSION = 1;

export interface BackupData {
  app: "EconomyK";
  version: number;
  createdAt: string;
  data: {
    transactions: {
      id: number;
      name: string;
      category: string;
      type: string;
      price: number;
      month: string;
      is_fixed: number;
      is_confirmed: number;
      installment_number: number | null;
      total_installments: number | null;
      installment_group_id: number | null;
      fixed_group_id: number | null;
    }[];
    categories: { name: string }[];
    fixedGroupClosures: {
      fixed_group_id: number;
      from_month: string;
    }[];
    financialReports: {
      month: string;
      report: string;
      generated_at: number;
    }[];
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value);
}

function isValidBackup(value: unknown): value is BackupData {
  if (!isObject(value)) return false;

  if (
    value.app !== "EconomyK" ||
    value.version !== BACKUP_VERSION ||
    typeof value.createdAt !== "string" ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    !isObject(value.data)
  ) {
    return false;
  }

  const { transactions, categories, fixedGroupClosures, financialReports } =
    value.data;

  if (
    !Array.isArray(transactions) ||
    !Array.isArray(categories) ||
    !Array.isArray(fixedGroupClosures) ||
    !Array.isArray(financialReports)
  ) {
    return false;
  }

  const validTransactions = transactions.every(
    (item: unknown) =>
      isObject(item) &&
      isNumber(item.id) &&
      typeof item.name === "string" &&
      typeof item.category === "string" &&
      typeof item.type === "string" &&
      isNumber(item.price) &&
      typeof item.month === "string" &&
      (item.is_fixed === 0 || item.is_fixed === 1) &&
      (item.is_confirmed === 0 || item.is_confirmed === 1) &&
      isNullableNumber(item.installment_number) &&
      isNullableNumber(item.total_installments) &&
      isNullableNumber(item.installment_group_id) &&
      isNullableNumber(item.fixed_group_id),
  );

  const validCategories = categories.every(
    (item: unknown) => isObject(item) && typeof item.name === "string",
  );

  const validClosures = fixedGroupClosures.every(
    (item: unknown) =>
      isObject(item) &&
      isNumber(item.fixed_group_id) &&
      typeof item.from_month === "string",
  );

  const validReports = financialReports.every(
    (item: unknown) =>
      isObject(item) &&
      typeof item.month === "string" &&
      typeof item.report === "string" &&
      isNumber(item.generated_at),
  );

  return validTransactions && validCategories && validClosures && validReports;
}

export async function exportBackup(): Promise<void> {
  const backup: BackupData = {
    app: "EconomyK",
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    data: {
      transactions: sqlite.getAllSync(
        "SELECT * FROM transactions",
      ) as BackupData["data"]["transactions"],
      categories: sqlite.getAllSync(
        "SELECT * FROM categories",
      ) as BackupData["data"]["categories"],
      fixedGroupClosures: sqlite.getAllSync(
        "SELECT * FROM fixed_group_closures",
      ) as BackupData["data"]["fixedGroupClosures"],
      financialReports: sqlite.getAllSync(
        "SELECT * FROM financial_reports",
      ) as BackupData["data"]["financialReports"],
    },
  };

  const json = JSON.stringify(backup, null, 2);

  const fileName = `economyk-backup-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;

  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, json);

  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error("Compartilhamento não disponível neste dispositivo.");
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "application/json",
    dialogTitle: "Exportar backup do EconomyK",
    UTI: "public.json",
  });
}

export async function selectBackup(): Promise<BackupData | null> {
  const saf = FileSystem.StorageAccessFramework;

  if (!saf) {
    throw new Error("A seleção de pastas está disponível apenas no Android.");
  }

  const permission = await saf.requestDirectoryPermissionsAsync();

  if (!permission.granted) {
    return null;
  }

  const files = await saf.readDirectoryAsync(permission.directoryUri);

  const jsonFiles = files.filter((uri) => {
    try {
      return decodeURIComponent(uri)
        .split("?")[0]
        .toLowerCase()
        .endsWith(".json");
    } catch {
      return uri.toLowerCase().endsWith(".json");
    }
  });

  if (jsonFiles.length === 0) {
    throw new Error("Nenhum arquivo JSON foi encontrado na pasta selecionada.");
  }

  const validBackups: BackupData[] = [];

  for (const uri of jsonFiles) {
    try {
      const content = await saf.readAsStringAsync(uri);
      const parsed: unknown = JSON.parse(content);

      if (isValidBackup(parsed)) {
        validBackups.push(parsed);
      }
    } catch {
      // Arquivo inválido ou que não pode ser lido.
    }
  }

  if (validBackups.length === 0) {
    throw new Error(
      "Não foi encontrado nenhum backup válido do EconomyK nessa pasta.",
    );
  }

  validBackups.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return validBackups[0];
}

export function restoreBackup(backup: BackupData): void {
  sqlite.withTransactionSync(() => {
    sqlite.runSync("DELETE FROM transactions");
    sqlite.runSync("DELETE FROM categories");
    sqlite.runSync("DELETE FROM fixed_group_closures");
    sqlite.runSync("DELETE FROM financial_reports");

    for (const item of backup.data.transactions) {
      sqlite.runSync(
        `INSERT INTO transactions (
          id, name, category, type, price, month,
          is_fixed, is_confirmed, installment_number,
          total_installments, installment_group_id, fixed_group_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        item.id,
        item.name,
        item.category,
        item.type,
        item.price,
        item.month,
        item.is_fixed,
        item.is_confirmed,
        item.installment_number,
        item.total_installments,
        item.installment_group_id,
        item.fixed_group_id,
      );
    }

    for (const item of backup.data.categories) {
      sqlite.runSync("INSERT INTO categories (name) VALUES (?)", item.name);
    }

    for (const item of backup.data.fixedGroupClosures) {
      sqlite.runSync(
        `INSERT INTO fixed_group_closures (
          fixed_group_id, from_month
        ) VALUES (?, ?)`,
        item.fixed_group_id,
        item.from_month,
      );
    }

    for (const item of backup.data.financialReports) {
      sqlite.runSync(
        `INSERT INTO financial_reports (
          month, report, generated_at
        ) VALUES (?, ?, ?)`,
        item.month,
        item.report,
        item.generated_at,
      );
    }
  });
}
