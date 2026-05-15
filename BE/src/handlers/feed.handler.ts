import type { Request, Response } from "express";
import { z } from "zod";
import type { RequestWithSession } from "../middleware/requireSession";
import {
  buildFeedLimits,
  countJobsForFeed,
  distinctJobCategories,
  distinctJobCities,
  listJobsForFeed,
} from "../services/jobs.service";

const FeedQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).max(50).optional().default(8),
  city: z.string().max(120).optional().default(""),
  category: z.string().max(120).optional().default(""),
  sort: z.enum(["newest", "salary_high", "salary_low"]).optional().default("newest"),
});

function jobsForViewer(
  jobs: Awaited<ReturnType<typeof listJobsForFeed>>["jobs"],
  authenticated: boolean,
) {
  if (authenticated) return jobs;
  return jobs.map(({ contactWaDigits: _wa, ...job }) => job);
}

export async function handleFeedGet(req: Request, res: Response): Promise<void> {
  const session = (req as RequestWithSession).session;
  const parsed = FeedQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { offset, limit, city, category, sort } = parsed.data;

  try {
    const total = await countJobsForFeed({ city: city || undefined, category: category || undefined });
    const { jobs } = await listJobsForFeed({
      city: city || undefined,
      category: category || undefined,
      sort,
      offset,
      limit,
    });
    const limits = session ? await buildFeedLimits(session.sub) : null;
    const [cities, categories] = await Promise.all([distinctJobCities(), distinctJobCategories()]);
    res.status(200).json({
      jobs: jobsForViewer(jobs, Boolean(session)),
      total,
      offset,
      limit,
      hasMore: offset + jobs.length < total,
      limits,
      authenticated: Boolean(session),
      meta: { cities, categories },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Feed error";
    res.status(500).json({ error: msg });
  }
}
