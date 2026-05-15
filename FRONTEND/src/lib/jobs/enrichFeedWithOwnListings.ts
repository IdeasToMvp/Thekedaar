import type { FeedJob } from "./types";

/** Ensure recruiter's own posts appear in the feed and are marked. */
export function enrichFeedWithOwnListings(filtered: FeedJob[], own: FeedJob[]): FeedJob[] {
  if (own.length === 0) return filtered;

  const ownById = new Map(own.map((j) => [j.id, { ...j, isOwnListing: true as const }]));
  const seen = new Set<string>();
  const merged: FeedJob[] = [];

  for (const job of filtered) {
    seen.add(job.id);
    const own = ownById.get(job.id);
    merged.push(own ?? { ...job, isOwnListing: false });
  }

  for (const job of own) {
    if (!seen.has(job.id)) {
      merged.push({ ...job, isOwnListing: true });
    }
  }

  merged.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  return merged;
}
