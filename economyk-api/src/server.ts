import express from "express";
import cors from "cors";
import "dotenv/config";
import reportRoutes from "./routes/report.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/reports", reportRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Economyk API está funcionando!",
  });
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Economyk API rodando na porta ${PORT}`);
});
