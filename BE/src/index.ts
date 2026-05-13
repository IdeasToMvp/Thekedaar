import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import webhookRoutes from "./routes/webhook.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.send("Thekedar Backend Running");
});

app.use("/webhooks", webhookRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});