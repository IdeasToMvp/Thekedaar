import { Router } from "express";
import { z } from "zod";
import { handleWorkersFeedGet } from "../handlers/workersFeed.handler";
import { optionalSession } from "../middleware/optionalSession";
import { requireSession, type RequestWithSession } from "../middleware/requireSession";
import { getUserCapabilities } from "../services/user.service";
import {
  buildWorkerHireLimits,
  listEmployerContactedWorkers,
  recordEmployerWorkerHire,
} from "../services/workers.service";

const router = Router();

router.get("/feed", optionalSession, handleWorkersFeedGet);

router.get("/contacted", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  try {
    const caps = await getUserCapabilities(session.sub);
    if (!caps.can_hire) {
      return res.status(403).json({ error: "Employer account required" });
    }
    const [contacted, limits] = await Promise.all([
      listEmployerContactedWorkers(session.sub),
      buildWorkerHireLimits(session.sub),
    ]);
    return res.status(200).json({ contacted, limits });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Could not load contacted workers";
    return res.status(500).json({ error: msg });
  }
});

router.post("/:workerId/hire", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  const workerId = typeof req.params.workerId === "string" ? req.params.workerId : req.params.workerId?.[0];
  if (!workerId || !z.string().uuid().safeParse(workerId).success) {
    return res.status(400).json({ error: "Invalid worker id" });
  }

  try {
    const caps = await getUserCapabilities(session.sub);
    if (!caps.can_hire) {
      return res.status(403).json({ error: "Employer account required" });
    }
    const result = await recordEmployerWorkerHire({
      employerId: session.sub,
      workerId,
    });
    const limits = await buildWorkerHireLimits(session.sub);
    return res.status(200).json({ ok: true, ...result, limits });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Hire failed";
    const status =
      msg.includes("allows contacting") ? 403 :
      msg.includes("not found") ? 404 :
      msg.includes("own profile") ? 400 : 400;
    return res.status(status).json({ error: msg });
  }
});

export default router;
