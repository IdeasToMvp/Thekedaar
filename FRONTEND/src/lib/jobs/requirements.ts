import type { FeedJob } from "./types";
import { formatCandidateRequirements } from "./listingDetails";

export function formatJobRequirements(job: FeedJob): string | null {
  return formatCandidateRequirements(job);
}
