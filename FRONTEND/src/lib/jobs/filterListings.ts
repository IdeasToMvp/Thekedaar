import type { FeedJob } from "./types";

/** Client-side search for employer "My listings" page. */
export function filterListingsBySearch(jobs: FeedJob[], query: string): FeedJob[] {
  const q = query.trim().toLowerCase();
  if (!q) return jobs;
  return jobs.filter((job) => {
    const haystack = [job.title, job.category, job.sector, job.city, job.publicLocation, job.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
