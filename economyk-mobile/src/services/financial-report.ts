import { API_URL } from "@/config/api";
import { getDeviceId } from "./device-id";

export interface FinancialReportInput {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  expensesByCategory: {
    category: string;
    amount: number;
  }[];
}

interface FinancialReportResponse {
  report: string;
}

interface ApiErrorResponse {
  error?: string;
  retryAfterSeconds?: number;
}

export class FinancialReportError extends Error {
  retryAfterSeconds?: number;

  constructor(message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "FinancialReportError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function generateFinancialReport(
  data: FinancialReportInput,
): Promise<string> {
  const deviceId = await getDeviceId();

  const response = await fetch(`${API_URL}/reports/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-device-id": deviceId,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    const error = result as ApiErrorResponse;

    throw new FinancialReportError(
      error.error || "Não foi possível gerar o relatório financeiro.",
      error.retryAfterSeconds,
    );
  }

  const report = (result as FinancialReportResponse).report;

  if (!report) {
    throw new FinancialReportError(
      "O servidor não retornou um relatório válido.",
    );
  }

  return report;
}
