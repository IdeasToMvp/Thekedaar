export type BillingPlan = "free" | "basic" | "pro";

export function normalizePlan(raw: string | null | undefined): BillingPlan {
  const p = (raw || "free").toLowerCase();
  if (p === "pro") return "pro";
  return "free";
}

export const PLAN_LIMITS = {
  feedContacts: { free: 10, pro: 50 },
  jobListingsLifetime: { free: 3 },
  jobListingsPerMonth: { pro: 10 },
} as const;

export type FeedLimits = {
  plan: BillingPlan;
  feedContacts: { used: number; max: number; remaining: number };
  jobListings: { used: number; max: number; scope: "lifetime" | "month" } | null;
  contactedJobIds: string[];
};
