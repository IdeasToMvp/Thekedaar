import { Router } from "express";
import { z } from "zod";
import { requireSession, type RequestWithSession } from "../middleware/requireSession";
import { getUserCapabilities } from "../services/user.service";
import {
  listIncomingApplications,
  listWorkerApplications,
  submitJobApplication,
  updateApplicationStatus,
} from "../services/applications.service";

const router = Router();

router.get("/mine", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  try {
    const caps = await getUserCapabilities(session.sub);
    if (!caps.can_seek) {
      return res.status(403).json({ error: "Worker profile required" });
    }
    const applications = await listWorkerApplications(session.sub);
    return res.status(200).json({ applications });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Could not load applications";
    return res.status(500).json({ error: msg });
  }
});

router.get("/incoming", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  try {
    const caps = await getUserCapabilities(session.sub);
    if (!caps.can_hire) {
      return res.status(403).json({ error: "Employer account required" });
    }
    const applications = await listIncomingApplications(session.sub);
    return res.status(200).json({ applications });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Could not load applications";
    return res.status(500).json({ error: msg });
  }
});

const StatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

router.patch("/:applicationId", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  const applicationId =
    typeof req.params.applicationId === "string" ? req.params.applicationId : req.params.applicationId?.[0];
  if (!applicationId || !z.string().uuid().safeParse(applicationId).success) {
    return res.status(400).json({ error: "Invalid application id" });
  }
  const parsed = StatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const caps = await getUserCapabilities(session.sub);
    if (!caps.can_hire) {
      return res.status(403).json({ error: "Employer account required" });
    }
    const application = await updateApplicationStatus({
      applicationId,
      recruiterId: session.sub,
      status: parsed.data.status,
    });
    return res.status(200).json({ ok: true, application });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Could not update application";
    const status = msg.includes("only manage") ? 403 : msg.includes("not found") ? 404 : 400;
    return res.status(status).json({ error: msg });
  }
});

export default router;
