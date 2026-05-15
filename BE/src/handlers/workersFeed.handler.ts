import type { Request, Response } from "express";
import { z } from "zod";
import type { RequestWithSession } from "../middleware/requireSession";
import { countWorkersForFeed, listWorkersForFeed } from "../services/workers.service";

const WorkersFeedQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).max(50).optional().default(24),
  city: z.string().max(120).optional().default(""),
  role: z.string().max(120).optional().default(""),
  sort: z.enum(["newest", "salary_high", "salary_low"]).optional().default("newest"),
});

function workersForViewer(
  workers: Awaited<ReturnType<typeof listWorkersForFeed>>["workers"],
  authenticated: boolean,
) {
  if (authenticated) return workers;
  return workers.map(({ contactWaDigits: _wa, ...worker }) => worker);
}

export async function handleWorkersFeedGet(req: Request, res: Response): Promise<void> {
  const session = (req as RequestWithSession).session;
  const parsed = WorkersFeedQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { offset, limit, city, role, sort } = parsed.data;

  try {
    const total = await countWorkersForFeed({
      city: city || undefined,
      role: role || undefined,
    });
    const { workers } = await listWorkersForFeed({
      city: city || undefined,
      role: role || undefined,
      sort,
      offset,
      limit,
      viewerId: session?.sub,
    });

    res.status(200).json({
      workers: workersForViewer(workers, Boolean(session)),
      total,
      offset,
      limit,
      hasMore: offset + workers.length < total,
      authenticated: Boolean(session),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Workers feed error";
    res.status(500).json({ error: msg });
  }
}
