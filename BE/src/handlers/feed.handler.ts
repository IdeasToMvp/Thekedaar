import type { Request, Response } from "express";
import { z } from "zod";
import type { RequestWithSession } from "../middleware/requireSession";
import { getWorkerApplicationMap } from "../services/applications.service";
import { getUserCapabilities } from "../services/user.service";
import {
  buildFeedLimits,
  countJobsForFeed,
  distinctJobCategories,
  distinctJobCities,
  listJobsForFeed,
  type JobFeedApiJob,
} from "../services/jobs.service";

const FeedQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).max(50).optional().default(8),
  city: z.string().max(120).optional().default(""),
  category: z.string().max(120).optional().default(""),
  sort: z.enum(["newest", "salary_high", "salary_low"]).optional().default("newest"),
});

function stripEmployerContact(job: JobFeedApiJob): JobFeedApiJob {
  const { contactWaDigits: _wa, ...rest } = job;
  return rest;
}

function jobsForViewer(
  jobs: JobFeedApiJob[],
  opts: {
    authenticated: boolean;
    applicationMap: Record<string, "pending" | "approved" | "rejected">;
    viewerId?: string;
    isWorker: boolean;
  },
): JobFeedApiJob[] {
  return jobs.map((job) => {
    const status = opts.applicationMap[job.id] ?? null;
    const withStatus = { ...job, applicationStatus: status };

    if (!opts.authenticated) {
      return stripEmployerContact(withStatus);
    }

    if (job.isOwnListing) {
      return withStatus;
    }

    if (opts.isWorker) {
      if (status === "approved") {
        return withStatus;
      }
      return stripEmployerContact(withStatus);
    }

    return withStatus;
  });
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
      viewerId: session?.sub,
    });

    let applicationMap: Record<string, "pending" | "approved" | "rejected"> = {};
    let isWorker = false;
    if (session) {
      applicationMap = await getWorkerApplicationMap(session.sub);
      const caps = await getUserCapabilities(session.sub);
      isWorker = caps.can_seek;
    }

    const limits = session ? await buildFeedLimits(session.sub) : null;
    const [cities, categories] = await Promise.all([distinctJobCities(), distinctJobCategories()]);
    res.status(200).json({
      jobs: jobsForViewer(jobs, {
        authenticated: Boolean(session),
        applicationMap,
        viewerId: session?.sub,
        isWorker,
      }),
      total,
      offset,
      limit,
      hasMore: offset + jobs.length < total,
      limits,
      authenticated: Boolean(session),
      applicationStatuses: applicationMap,
      meta: { cities, categories },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Feed error";
    res.status(500).json({ error: msg });
  }
}
