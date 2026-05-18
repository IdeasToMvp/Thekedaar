export type JobUrgency = "low" | "medium" | "high";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export type FeedJob = {
  id: string;
  title: string;
  city: string;
  sector?: string;
  publicLocation?: string;
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
  minAge?: number | null;
  maxAge?: number | null;
  preferredGender?: string | null;
  requiredDocuments?: string[];
  experienceYearsRequired?: number | null;
  posterSubscription: { plan: string; features: Record<string, boolean> };
  contactWaDigits?: string;
  applicationStatus?: ApplicationStatus | null;
  /** Set when the signed-in user posted this job */
  isOwnListing?: boolean;
};

export type FeedLimits = {
  plan: string;
  feedContacts: { used: number; max: number; remaining: number };
  jobListings: { used: number; max: number; scope: "lifetime" | "month" } | null;
  contactedJobIds: string[];
  wallet?: { balanceInr: number; unlockCostInr: number };
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
  applicationStatuses?: Record<string, ApplicationStatus>;
  error?: string;
  hint?: string;
};
