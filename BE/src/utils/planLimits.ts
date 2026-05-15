export type BillingPlan = "free" | "basic" | "pro";

export function normalizePlan(raw: string | null | undefined): BillingPlan {
  const p = (raw || "free").toLowerCase();
  if (p === "pro") return "pro";
  if (p === "basic") return "basic";
  return "free";
}

/** Distinct jobs a user may contact (apply / WhatsApp / hire) per plan. */
export function maxFeedJobContacts(plan: BillingPlan): number {
  if (plan === "pro") return 50;
  return 10;
}

/** Lifetime job rows for free-tier recruiters. */
export function maxFreeTierJobListings(): number {
  return 3;
}

/** New listings per calendar month for Pro recruiters. */
export function maxProTierListingsPerMonth(): number {
  return 10;
}
