import type { FeedJob } from "./types";
import { formatCandidateRequirements } from "./listingDetails";

/** @deprecated Use formatCandidateRequirements or JobListingMeta */
export function formatJobRequirements(job: FeedJob): string | null {
  return formatCandidateRequirements(job);
}
