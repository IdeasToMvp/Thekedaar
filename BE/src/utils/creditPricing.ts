/** Employer billing via Theke Credits (1 credit = ₹1 = 100 paise). */

export const ONBOARDING_CREDITS_PAISE = 10_000; // ₹100 welcome credits

export const PRICE_LISTING_PAISE = 4_900; // ₹49
export const PRICE_WORKER_UNLOCK_PAISE = 2_000; // ₹20
export const PRICE_URGENT_BADGE_PAISE = 2_900; // ₹29

export const MIN_TOPUP_PAISE = 5_000; // ₹50

export function isUrgentUrgency(urgency: string | null | undefined): boolean {
  const t = (urgency || "").toLowerCase();
  return t.includes("high") || t.includes("immediate");
}

export function paiseToInr(paise: number): number {
  return paise / 100;
}

export function inrToPaise(inr: number): number {
  return Math.round(inr * 100);
}
