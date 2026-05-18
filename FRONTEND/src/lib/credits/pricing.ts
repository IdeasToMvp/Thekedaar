/** Mirror BE creditPricing.ts — keep in sync. */
export const ONBOARDING_CREDITS_INR = 100;

export const PRICE_LISTING_INR = 49;
export const PRICE_UNLOCK_INR = 20;
export const PRICE_URGENT_INR = 29;

export function isUrgentUrgency(urgency: string): boolean {
  const t = urgency.toLowerCase();
  return t.includes("immediate") || t.includes("high");
}

export function estimateNewJobCostInr(urgency: string): { listing: number; urgent: number; total: number } {
  const listing = PRICE_LISTING_INR;
  const urgent = isUrgentUrgency(urgency) ? PRICE_URGENT_INR : 0;
  return { listing, urgent, total: listing + urgent };
}
