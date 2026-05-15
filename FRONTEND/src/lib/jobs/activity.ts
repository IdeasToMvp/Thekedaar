import type { FeedJob, FeedLimits } from "./types";

export type ActivityResponse = {
  myListings: FeedJob[];
  applied: unknown[];
  shortlisted: unknown[];
  limits?: FeedLimits | null;
  error?: string;
};
