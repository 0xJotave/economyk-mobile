import { Router } from "express";
import { reportSchema } from "../schemas/report.schema.js";
import { generateFinancialReport } from "../services/gemini.service.js";

const router = Router();

const COOLDOWN_MS = 3 * 60 * 1000;

const lastGenerationByDevice = new Map<string, number>();

router.post("/generate", async (req, res) => {
  const deviceId = req.header("x-device-id");

  if (!deviceId || deviceId.length > 100) {
    return res.status(400).json({
      error: "Identificador do dispositivo inválido.",
    });
  }

  const validation = reportSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: "Dados financeiros inválidos.",
      details: validation.error.issues,
    });
  }

  const now = Date.now();
  const lastGeneration = lastGenerationByDevice.get(deviceId);

  if (lastGeneration !== undefined) {
    const elapsed = now - lastGeneration;

    if (elapsed < COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil(
        (COOLDOWN_MS - elapsed) / 1000,
      );

      return res.status(429).json({
        error: "Você precisa aguardar antes de gerar outro relatório.",
        retryAfterSeconds,
      });
    }
  }

  lastGenerationByDevice.set(deviceId, now);

  try {
    const report = await generateFinancialReport(validation.data);

    return res.status(200).json({ report });
  } catch (error) {
    lastGenerationByDevice.delete(deviceId);

    console.error("Erro ao gerar relatório:", error);

    return res.status(500).json({
      error: "Não foi possível gerar o relatório financeiro.",
    });
  }
});

export default router;
