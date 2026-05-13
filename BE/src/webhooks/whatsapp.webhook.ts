import type { Request, Response } from "express";
import { z } from "zod";
import { handleIncomingWhatsAppMessage } from "../services/inbound.service";

const VerifyQuerySchema = z.object({
  "hub.mode": z.string().optional(),
  "hub.verify_token": z.string().optional(),
  "hub.challenge": z.string().optional(),
});

export async function whatsappVerifyWebhook(req: Request, res: Response) {
  const parsed = VerifyQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).send("Bad Request");
  }

  const mode = parsed.data["hub.mode"];
  const token = parsed.data["hub.verify_token"];
  const challenge = parsed.data["hub.challenge"];

  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expected) {
    return res.status(500).send("WHATSAPP_VERIFY_TOKEN not set");
  }

  if (mode === "subscribe" && token && challenge && token === expected) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
}

/**
 * Meta expects a fast 200 OK. We acknowledge immediately and process async.
 */
export async function whatsappIncomingWebhook(req: Request, res: Response) {
  res.sendStatus(200);

  try {
    await handleIncomingWhatsAppMessage(req.body);
  } catch (e) {
    // Avoid throwing after response; log for debugging
    // eslint-disable-next-line no-console
    console.error("WhatsApp webhook handler error:", e);
  }
}

