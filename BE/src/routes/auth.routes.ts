import { Router } from "express";
import { z } from "zod";
import { exchangeMagicLinkToken, signSessionJwt, verifySessionJwt } from "../services/magicLink.service";
import { requestLoginLinkViaWhatsApp } from "../services/requestLoginLink.service";
import { allowRateLimit } from "../utils/rateLimit";
import { normalizePhoneForWhatsApp } from "../utils/phone";

const router = Router();

const ExchangeSchema = z.object({
  token: z.string().min(40),
});

router.post("/exchange", async (req, res) => {
  const parsed = ExchangeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const claims = await exchangeMagicLinkToken(parsed.data.token);
    const sessionToken = signSessionJwt(claims);
    return res.status(200).json({ sessionToken, user: claims });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Exchange failed";
    const status =
      msg.includes("expired") ? 410 :
      msg.includes("used") ? 409 :
      msg.includes("Invalid") ? 401 : 400;
    return res.status(status).json({ error: msg });
  }
});

router.get("/me", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const raw = auth.slice("Bearer ".length).trim();
  if (!raw) return res.status(401).json({ error: "Unauthorized" });
  try {
    const user = verifySessionJwt(raw);
    return res.status(200).json({ user });
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
});

const RequestLinkSchema = z.object({
  phone: z.string().min(8).max(32),
});

router.post("/request-login-link", async (req, res) => {
  const parsed = RequestLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const normalized = normalizePhoneForWhatsApp(parsed.data.phone);
  if (!normalized) {
    return res.status(400).json({ error: "Invalid phone number" });
  }

  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    typeof forwarded === "string"
      ? forwarded.split(",")[0]?.trim() || "unknown"
      : (req.socket.remoteAddress ?? "unknown");

  if (!allowRateLimit(`rll:ip:${ip}`, 30, 60 * 60 * 1000)) {
    return res.status(429).json({ error: "Too many requests. Try again later." });
  }
  if (!allowRateLimit(`rll:phone:${normalized}`, 5, 60 * 60 * 1000)) {
    return res.status(429).json({ error: "Too many requests. Try again later." });
  }

  try {
    await requestLoginLinkViaWhatsApp(parsed.data.phone);
  } catch (e) {
    console.error("request-login-link:", e);
  }

  return res.status(200).json({ ok: true });
});

export default router;

