export type JobUrgency = "low" | "medium" | "high";

export type FeedJob = {
  id: string;
  title: string;
  city: string;
  category: string;
  salaryPerMonth: number;
  postedAt: string;
  employerDisplayName: string;
  employerAvatarKey: string;
  description: string;
  urgency: JobUrgency;
  urgencyRaw?: string | null;
  timing?: string | null;
  accommodation?: boolean | null;
  posterSubscription: { plan: string; features: Record<string, boolean> };
  contactWaDigits?: string;
  /** Set when the signed-in user posted this job */
  isOwnListing?: boolean;
};

export type FeedLimits = {
  plan: string;
  feedContacts: { used: number; max: number; remaining: number };
  jobListings: { used: number; max: number; scope: "lifetime" | "month" } | null;
  contactedJobIds: string[];
};

export type FeedResponse = {
  jobs: FeedJob[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  authenticated?: boolean;
  limits?: FeedLimits | null;
  meta?: { cities: string[]; categories: string[] };
  error?: string;
  hint?: string;
};
