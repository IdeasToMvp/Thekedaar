import { Router } from "express";
import {
  whatsappVerifyWebhook,
  whatsappIncomingWebhook,
} from "../webhooks/whatsapp.webhook";

const router = Router();

router.get("/whatsapp", whatsappVerifyWebhook);
router.post("/whatsapp", whatsappIncomingWebhook);

export default router;

