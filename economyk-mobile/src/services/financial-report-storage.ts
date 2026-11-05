
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { financialReports } from "@/db/schema";

export interface StoredFinancialReport {
  month: string;
  report: string;
  generatedAt: number;
}

// Busca o relatório de um mês específico.
export async function getStoredFinancialReport(
  month: string,
): Promise<StoredFinancialReport | null> {
  const [storedReport] = await db
    .select()
    .from(financialReports)
    .where(eq(financialReports.month, month))
    .limit(1);

  return storedReport ?? null;
}

// Salva ou atualiza o relatório de um mês.
export async function saveFinancialReport(
  month: string,
  report: string,
): Promise<void> {
  await db
    .insert(financialReports)
    .values({
      month,
      report,
      generatedAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: financialReports.month,
      set: {
        report,
        generatedAt: Date.now(),
      },
    });
}
