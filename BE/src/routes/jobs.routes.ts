import { Router } from "express";
import { z } from "zod";
import { handleFeedGet } from "../handlers/feed.handler";
import { optionalSession } from "../middleware/optionalSession";
import { requireSession, type RequestWithSession } from "../middleware/requireSession";
import { upsertRecruiterProfile } from "../services/recruiter.service";
import { updateUserProfile } from "../services/user.service";
import { submitJobApplication } from "../services/applications.service";
import { isWalletError } from "../errors/walletErrors";
import {
  buildFeedLimits,
  closeJobForRecruiter,
  createJob,
  getJobById,
  listHireCandidatesForJob,
  recordFeedJobContact,
  updateJobForRecruiter,
} from "../services/jobs.service";

const router = Router();

router.get("/feed", optionalSession, handleFeedGet);

const CreateJobBodySchema = z.object({
  title: z.string().min(1).max(120),
  city: z.string().min(1).max(80).optional().nullable(),
  sector: z.string().max(80).optional().nullable(),
  salary: z.number().int().positive().max(10_000_000).optional().nullable(),
  timing: z.string().max(120).optional().nullable(),
  accommodation: z.boolean().optional().nullable(),
  urgency: z.string().max(80).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  minAge: z.number().int().min(16).max(80).optional().nullable(),
  maxAge: z.number().int().min(16).max(80).optional().nullable(),
  preferredGender: z.enum(["any", "male", "female"]).optional().nullable(),
  requiredDocuments: z.array(z.enum(["aadhaar"])).max(4).optional().nullable(),
  experienceYearsRequired: z.number().int().min(0).max(80).optional().nullable(),
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
      sector: body.sector?.trim() || null,
      salary: body.salary ?? null,
      timing: body.timing?.trim() || null,
      accommodation: body.accommodation ?? null,
      urgency: body.urgency?.trim() || null,
      category: body.category?.trim() || null,
      description: body.description?.trim() || null,
      minAge: body.minAge ?? null,
      maxAge: body.maxAge ?? null,
      preferredGender: body.preferredGender ?? null,
      requiredDocuments: body.requiredDocuments ?? [],
      experienceYearsRequired: body.experienceYearsRequired ?? null,
    });

    return res.status(201).json({ ok: true, jobId: job.id });
  } catch (e: unknown) {
    if (isWalletError(e)) {
      return res.status(e.statusCode).json({
        error: e.message,
        code: e.code,
        ...e.details,
      });
    }
    const msg = e instanceof Error ? e.message : "Could not create job";
    return res.status(400).json({ error: msg });
  }
});

const UpdateJobBodySchema = z
  .object({
    salary: z.number().int().positive().max(10_000_000).optional().nullable(),
    timing: z.string().max(120).optional().nullable(),
    accommodation: z.boolean().optional().nullable(),
    urgency: z.string().max(80).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    minAge: z.number().int().min(16).max(80).optional().nullable(),
    maxAge: z.number().int().min(16).max(80).optional().nullable(),
    preferredGender: z.enum(["any", "male", "female"]).optional().nullable(),
    requiredDocuments: z.array(z.enum(["aadhaar"])).max(4).optional().nullable(),
    experienceYearsRequired: z.number().int().min(0).max(80).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

const CloseJobBodySchema = z.object({
  didHire: z.boolean(),
  hiredWorkerId: z.string().uuid().optional().nullable(),
  hireSource: z.enum(["platform_worker", "off_platform", "not_hired"]).optional(),
  hiredWorkerName: z.string().min(1).max(120).optional().nullable(),
});

router.patch("/:jobId", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  const jobId = typeof req.params.jobId === "string" ? req.params.jobId : req.params.jobId?.[0];
  if (!jobId || !z.string().uuid().safeParse(jobId).success) {
    return res.status(400).json({ error: "Invalid job id" });
  }
  const parsed = UpdateJobBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const body = parsed.data;
    const result = await updateJobForRecruiter({
      jobId,
      recruiterId: session.sub,
      salary: body.salary,
      timing: body.timing,
      accommodation: body.accommodation,
      urgency: body.urgency,
      description: body.description,
      minAge: body.minAge,
      maxAge: body.maxAge,
      preferredGender: body.preferredGender,
      requiredDocuments: body.requiredDocuments,
      experienceYearsRequired: body.experienceYearsRequired,
    });
    return res.status(200).json({ ok: true, jobId, ...result });
  } catch (e: unknown) {
    if (isWalletError(e)) {
      return res.status(e.statusCode).json({
        error: e.message,
        code: e.code,
        ...e.details,
      });
    }
    const msg = e instanceof Error ? e.message : "Could not update job";
    const status =
      msg.includes("only edit your own") ? 403 :
      msg.includes("not found") ? 404 :
      msg.includes("closed") || msg.includes("Edit limit") || msg.includes("Urgency cannot") ? 400 : 400;
    return res.status(status).json({ error: msg });
  }
});

router.get("/:jobId/hire-candidates", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  const jobId = typeof req.params.jobId === "string" ? req.params.jobId : req.params.jobId?.[0];
  if (!jobId || !z.string().uuid().safeParse(jobId).success) {
    return res.status(400).json({ error: "Invalid job id" });
  }
  try {
    const candidates = await listHireCandidatesForJob(jobId, session.sub);
    return res.status(200).json({ ok: true, candidates });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Could not load candidates";
    const status = msg.includes("your own") ? 403 : msg.includes("not found") ? 404 : 400;
    return res.status(status).json({ error: msg });
  }
});

router.post("/:jobId/close", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  const jobId = typeof req.params.jobId === "string" ? req.params.jobId : req.params.jobId?.[0];
  if (!jobId || !z.string().uuid().safeParse(jobId).success) {
    return res.status(400).json({ error: "Invalid job id" });
  }
  const parsed = CloseJobBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }
  try {
    const body = parsed.data;
    const hireSource =
      body.didHire ?
        body.hireSource === "off_platform" ? "off_platform" as const :
        body.hireSource === "platform_worker" ? "platform_worker" as const :
        undefined :
      "not_hired" as const;

    await closeJobForRecruiter({
      jobId,
      recruiterId: session.sub,
      didHire: body.didHire,
      hiredWorkerId: body.hiredWorkerId,
      hireSource,
      hiredWorkerName: body.hiredWorkerName,
    });
    return res.status(200).json({ ok: true, jobId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Could not close listing";
    const status =
      msg.includes("your own") ? 403 :
      msg.includes("already closed") ? 409 :
      msg.includes("not found") ? 404 : 400;
    return res.status(status).json({ error: msg });
  }
});

const ContactBodySchema = z.object({
  action: z.enum(["apply", "whatsapp", "hire"]),
});

router.post("/:jobId/apply", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  const jobId = typeof req.params.jobId === "string" ? req.params.jobId : req.params.jobId?.[0];
  if (!jobId || !z.string().uuid().safeParse(jobId).success) {
    return res.status(400).json({ error: "Invalid job id" });
  }

  try {
    const { application, created } = await submitJobApplication({
      workerId: session.sub,
      jobId,
    });
    return res.status(created ? 201 : 200).json({
      ok: true,
      created,
      application,
      message: created
        ? "Application sent. The employer will review it on Thekedaar and WhatsApp."
        : "You already applied to this job.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Apply failed";
    const status =
      msg.includes("worker profile") ? 403 :
      msg.includes("cannot apply again") ? 409 :
      msg.includes("closed") ? 400 :
      msg.includes("own listing") ? 400 :
      msg.includes("not found") ? 404 : 400;
    return res.status(status).json({ error: msg });
  }
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
    if ((job.listing_status ?? "open") === "closed") {
      return res.status(400).json({ error: "This listing is closed" });
    }
    if (parsed.data.action === "apply") {
      const { application, created } = await submitJobApplication({
        workerId: session.sub,
        jobId,
      });
      const limits = await buildFeedLimits(session.sub);
      return res.status(200).json({
        ok: true,
        recorded: created,
        application,
        limits,
      });
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
