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
  posterSubscription: { plan: string; features: Record<string, boolean> };
  contactWaDigits?: string;
};

export type FeedResponse = {
  jobs: FeedJob[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  meta?: { cities: string[]; categories: string[] };
  error?: string;
  hint?: string;
};
