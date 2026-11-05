import { API_URL } from "@/config/api";

export async function wakeUpApi(): Promise<void> {
  try {
    await fetch(`${API_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Falha silenciosa: o aplicativo continua funcionando offline.
  }
}
