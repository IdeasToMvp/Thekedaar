import { Router } from "express";
import { z } from "zod";
import { handleFeedGet } from "../handlers/feed.handler";
import { optionalSession } from "../middleware/optionalSession";
import { requireSession, type RequestWithSession } from "../middleware/requireSession";
import { upsertRecruiterProfile } from "../services/recruiter.service";
import { updateUserProfile } from "../services/user.service";
import { buildFeedLimits, createJob, getJobById, recordFeedJobContact } from "../services/jobs.service";

const router = Router();

router.get("/feed", optionalSession, handleFeedGet);

const CreateJobBodySchema = z.object({
  title: z.string().min(1).max(120),
  city: z.string().min(1).max(80).optional().nullable(),
  salary: z.number().int().positive().max(10_000_000).optional().nullable(),
  timing: z.string().max(120).optional().nullable(),
  accommodation: z.boolean().optional().nullable(),
  urgency: z.string().max(80).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

router.post("/", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  const parsed = CreateJobBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
  }

  try {
    await upsertRecruiterProfile({
      userId: session.sub,
      hiringType: "individual",
    });
    await updateUserProfile({
      userId: session.sub,
      current_mode: "recruiter",
    });

    const body = parsed.data;
    const job = await createJob({
      recruiterId: session.sub,
      title: body.title.trim(),
      city: body.city?.trim() || null,
      salary: body.salary ?? null,
      timing: body.timing?.trim() || null,
      accommodation: body.accommodation ?? null,
      urgency: body.urgency?.trim() || null,
      category: body.category?.trim() || null,
      description: body.description?.trim() || null,
    });

    return res.status(201).json({ ok: true, jobId: job.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Could not create job";
    const status = msg.includes("allows up to") || msg.includes("Upgrade") ? 403 : 400;
    return res.status(status).json({ error: msg });
  }
});

const ContactBodySchema = z.object({
  action: z.enum(["apply", "whatsapp", "hire"]),
});

router.post("/:jobId/contact", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  const jobId = typeof req.params.jobId === "string" ? req.params.jobId : req.params.jobId?.[0];
  if (!jobId || !z.string().uuid().safeParse(jobId).success) {
    return res.status(400).json({ error: "Invalid job id" });
  }
  const parsed = ContactBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const job = await getJobById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    const result = await recordFeedJobContact({
      userId: session.sub,
      jobId,
      action: parsed.data.action,
    });
    const limits = await buildFeedLimits(session.sub);
    return res.status(200).json({ ok: true, ...result, limits });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Contact failed";
    const status = msg.includes("allows contacting") ? 403 : 400;
    return res.status(status).json({ error: msg });
  }
});

export default router;
