import type { Request, Response } from "express";
import { z } from "zod";
import type { RequestWithSession } from "../middleware/requireSession";
import { getUserCapabilities } from "../services/user.service";
import { formatSupabaseError } from "../utils/feedSearch";
import { buildWorkerHireLimits, countWorkersForFeed, listWorkersForFeed } from "../services/workers.service";

const WorkersFeedQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).max(50).optional().default(24),
  city: z.string().max(120).optional().default(""),
  role: z.string().max(120).optional().default(""),
  sector: z.string().max(120).optional().default(""),
  q: z.string().max(80).optional().default(""),
  sort: z.enum(["newest", "salary_high", "salary_low"]).optional().default("newest"),
});

function workersForViewer(
  workers: Awaited<ReturnType<typeof listWorkersForFeed>>["workers"],
  opts: { viewerId?: string; viewerCanHire: boolean },
) {
  return workers.map((w) => {
    const isOwn = opts.viewerId != null && w.id === opts.viewerId;
    if (isOwn) return w;
    if (opts.viewerCanHire) {
      const { contactWaDigits: _wa, ...rest } = w;
      return rest;
    }
    return w;
  });
}

export async function handleWorkersFeedGet(req: Request, res: Response): Promise<void> {
  const session = (req as RequestWithSession).session;
  const parsed = WorkersFeedQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { offset, limit, city, role, sector, q, sort } = parsed.data;

  try {
    const total = await countWorkersForFeed({
      city: city || undefined,
      role: role || undefined,
      sector: sector || undefined,
      q: q || undefined,
    });
    const { workers } = await listWorkersForFeed({
      city: city || undefined,
      role: role || undefined,
      sector: sector || undefined,
      q: q || undefined,
      sort,
      offset,
      limit,
      viewerId: session?.sub,
    });

    let viewerCanHire = false;
    let contactedWorkerIds: string[] = [];
    let limits: Awaited<ReturnType<typeof buildWorkerHireLimits>> | undefined;
    if (session?.sub) {
      const caps = await getUserCapabilities(session.sub);
      viewerCanHire = caps.can_hire;
      if (viewerCanHire) {
        limits = await buildWorkerHireLimits(session.sub);
        contactedWorkerIds = limits.contactedWorkerIds;
      }
    }

    res.status(200).json({
      workers: workersForViewer(workers, { viewerId: session?.sub, viewerCanHire }),
      total,
      offset,
      limit,
      hasMore: offset + workers.length < total,
      authenticated: Boolean(session),
      contactedWorkerIds,
      limits,
    });
  } catch (e: unknown) {
    res.status(500).json({ error: formatSupabaseError(e) });
  }
}
