/** Display name for the in-app wallet currency (employers). */
export const THEKE_CREDITS_NAME = "Theke Credits";

/** 1 credit = ₹1 (paise stored in BE when wallet ships). */
export const THEKE_CREDITS_RUPEE_RATIO = 1;

/** Minimum top-up in rupees (wallet UI). */
export const THEKE_CREDITS_MIN_TOPUP_INR = 49;

/** Maximum single top-up in rupees. */
export const THEKE_CREDITS_MAX_TOPUP_INR = 50_000;

export const THEKE_CREDITS_POLICIES = [
  {
    id: "non_refundable",
    label: "Non-refundable",
    detail: "Credits added to your wallet cannot be refunded to your bank or UPI.",
  },
  {
    id: "no_expiry",
    label: "No expiry",
    detail: "Your balance stays in your account until you use it.",
  },
  {
    id: "usable_anytime",
    label: "Usable anytime",
    detail: "Spend credits when you need paid hiring features (e.g. extra listings or contact unlocks).",
  },
] as const;

/** Shown near top-up and wallet flows. */
export const THEKE_CREDITS_DISCLAIMER =
  "Theke Credits are used for digital hiring services and are generally non-refundable once added.";
