import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import webhookRoutes from "./routes/webhook.routes";
import authRoutes from "./routes/auth.routes";
import jobsRoutes from "./routes/jobs.routes";
import workersRoutes from "./routes/workers.routes";
import applicationsRoutes from "./routes/applications.routes";
import walletRoutes from "./routes/wallet.routes";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.send("Thekedar Backend Running");
});

app.use("/webhooks", webhookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/workers", workersRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/wallet", walletRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});