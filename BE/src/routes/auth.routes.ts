import { Router } from "express";
import { z } from "zod";
import { handleFeedGet } from "../handlers/feed.handler";
import { exchangeMagicLinkToken, signSessionJwt, sessionClaimsForUserId } from "../services/magicLink.service";
import { requestLoginLinkViaWhatsApp } from "../services/requestLoginLink.service";
import {
  deleteAccount,
  pauseAccount,
  reactivateAccount,
} from "../services/accountLifecycle.service";
import { isAccountRestrictedError } from "../errors/accountErrors";
import { getUserWithProfiles, updateUserProfile, type UserRow } from "../services/user.service";
import { allowRateLimit } from "../utils/rateLimit";
import { normalizePhoneForWhatsApp } from "../utils/phone";
import { optionalSession } from "../middleware/optionalSession";
import { requireSession, type RequestWithSession } from "../middleware/requireSession";
import { subscriptionPayload } from "../utils/subscription";
import {
  buildFeedLimits,
  listRecruiterOwnListings,
  listUserFeedContactActivity,
} from "../services/jobs.service";

const router = Router();

type FullUser = NonNullable<Awaited<ReturnType<typeof getUserWithProfiles>>>;

function mePayload(full: FullUser) {
  return {
    user: {
      id: full.user.id,
      sub: full.user.id,
      phone: full.user.phone,
      name: full.user.name,
      city: full.user.city,
      sector: full.user.sector,
      current_mode: full.user.current_mode,
      can_seek: full.worker_profile != null,
      can_hire: full.recruiter_profile != null,
      account_status: full.user.account_status ?? "active",
      paused_at: full.user.paused_at ?? null,
      deleted_at: full.user.deleted_at ?? null,
      subscription: subscriptionPayload(full.user as UserRow),
    },
    worker_profile: full.worker_profile,
    recruiter_profile: full.recruiter_profile,
  };
}

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
    const full = await getUserWithProfiles(claims.sub);
    if (!full) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ sessionToken, ...mePayload(full) });
  } catch (e: unknown) {
    if (isAccountRestrictedError(e)) {
      return res.status(e.statusCode).json({ error: e.message, code: e.code });
    }
    const msg = e instanceof Error ? e.message : "Exchange failed";
    const status =
      msg.includes("expired") ? 410 :
      msg.includes("used") ? 409 :
      msg.includes("Invalid") ? 401 : 400;
    return res.status(status).json({ error: msg });
  }
});

router.get("/feed", optionalSession, handleFeedGet);

router.get("/activity", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  try {
    const [contacts, limits, listings] = await Promise.all([
      listUserFeedContactActivity(session.sub),
      buildFeedLimits(session.sub),
      listRecruiterOwnListings(session.sub),
    ]);
    const applied = contacts.filter((c) => c.action === "apply" || c.action === "whatsapp");
    const shortlisted = contacts.filter((c) => c.action === "hire" || c.action === "whatsapp");
    return res.status(200).json({
      applied,
      shortlisted,
      myListings: listings,
      limits,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Activity error";
    return res.status(500).json({ error: msg });
  }
});

router.get("/me", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  const full = await getUserWithProfiles(session.sub);
  if (!full) {
    return res.status(401).json({
      error: "Session expired. Please sign in again.",
      code: "SESSION_STALE",
    });
  }
  return res.status(200).json(mePayload(full));
});

const ProfilePatchSchema = z.object({
  name: z.string().max(120).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  sector: z.string().max(80).optional().nullable(),
  current_mode: z.enum(["worker", "recruiter"]).optional(),
  worker: z
    .object({
      role: z.string().max(120).optional().nullable(),
      skills: z.array(z.string().min(1).max(80)).max(8).optional().nullable(),
      age: z.number().int().min(16).max(80).optional().nullable(),
      gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional().nullable(),
      has_aadhaar: z.boolean().optional().nullable(),
      experience_years: z.number().int().min(0).max(80).optional().nullable(),
      expected_salary: z.number().int().min(0).optional().nullable(),
      availability: z.string().max(240).optional().nullable(),
    })
    .optional(),
  recruiter: z
    .object({
      business_name: z.string().max(200).optional().nullable(),
      hiring_type: z.string().max(120).optional().nullable(),
      company_name: z.string().max(200).optional().nullable(),
    })
    .optional(),
});

router.post("/account/pause", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  try {
    const user = await pauseAccount(session.sub);
    const full = await getUserWithProfiles(user.id);
    if (!full) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({ ok: true, ...mePayload(full) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Could not pause account";
    return res.status(400).json({ error: msg });
  }
});

router.post("/account/reactivate", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  try {
    const user = await reactivateAccount(session.sub);
    const claims = await sessionClaimsForUserId(user.id);
    const sessionToken = signSessionJwt(claims);
    const full = await getUserWithProfiles(user.id);
    if (!full) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({ ok: true, sessionToken, ...mePayload(full) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Could not reactivate account";
    return res.status(400).json({ error: msg });
  }
});

router.post("/account/delete", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  try {
    await deleteAccount(session.sub);
    return res.status(200).json({ ok: true, deleted: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Could not delete account";
    return res.status(400).json({ error: msg });
  }
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
      sector: parsed.data.sector,
      current_mode: parsed.data.current_mode,
      worker: parsed.data.worker,
      recruiter: parsed.data.recruiter,
    });
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }
    const claims = await sessionClaimsForUserId(updated.user.id);
    const sessionToken = signSessionJwt(claims);
    return res.status(200).json({
      sessionToken,
      ...mePayload(updated),
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
    const result = await requestLoginLinkViaWhatsApp(parsed.data.phone);
    return res.status(200).json({ ok: true, ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to send login link";
    console.error("request-login-link:", e);
    return res.status(502).json({ ok: false, error: msg });
  }
});

export default router;
