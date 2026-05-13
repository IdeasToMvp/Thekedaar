import { Router } from "express";
import { z } from "zod";
import {
  exchangeMagicLinkToken,
  signSessionJwt,
  sessionClaimsFromUserRow,
} from "../services/magicLink.service";
import { requestLoginLinkViaWhatsApp } from "../services/requestLoginLink.service";
import { getUserWithWorkerProfile, updateUserProfile } from "../services/user.service";
import { allowRateLimit } from "../utils/rateLimit";
import { normalizePhoneForWhatsApp } from "../utils/phone";
import { requireSession, type RequestWithSession } from "../middleware/requireSession";

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

router.get("/me", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  const full = await getUserWithWorkerProfile(session.sub);
  if (!full) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.status(200).json({
    user: {
      id: full.user.id,
      sub: full.user.id,
      phone: full.user.phone,
      role: full.user.role,
      hiring_enabled: full.user.hiring_enabled,
      seeking_enabled: full.user.seeking_enabled,
      name: full.user.name,
      city: full.user.city,
    },
    worker_profile: full.worker_profile,
  });
});

const ProfilePatchSchema = z.object({
  name: z.string().max(120).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  hiring_enabled: z.boolean().optional(),
  seeking_enabled: z.boolean().optional(),
  worker: z
    .object({
      job_type: z.string().max(120).optional().nullable(),
      experience_years: z.number().int().min(0).max(80).optional().nullable(),
      expected_salary: z.number().int().min(0).optional().nullable(),
      availability: z.string().max(240).optional().nullable(),
    })
    .optional(),
});

router.patch("/profile", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  const parsed = ProfilePatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const updated = await updateUserProfile({
      userId: session.sub,
      name: parsed.data.name,
      city: parsed.data.city,
      hiring_enabled: parsed.data.hiring_enabled,
      seeking_enabled: parsed.data.seeking_enabled,
      worker: parsed.data.worker,
    });
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }
    const claims = sessionClaimsFromUserRow(updated.user);
    const sessionToken = signSessionJwt(claims);
    return res.status(200).json({
      sessionToken,
      user: {
        id: updated.user.id,
        sub: updated.user.id,
        phone: updated.user.phone,
        role: updated.user.role,
        hiring_enabled: updated.user.hiring_enabled,
        seeking_enabled: updated.user.seeking_enabled,
        name: updated.user.name,
        city: updated.user.city,
      },
      worker_profile: updated.worker_profile,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return res.status(400).json({ error: msg });
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
