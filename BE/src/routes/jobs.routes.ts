import { Router } from "express";
import { z } from "zod";
import { handleFeedGet } from "../handlers/feed.handler";
import { requireSession, type RequestWithSession } from "../middleware/requireSession";
import { buildFeedLimits, getJobById, recordFeedJobContact } from "../services/jobs.service";

const router = Router();

router.get("/feed", requireSession, handleFeedGet);

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
