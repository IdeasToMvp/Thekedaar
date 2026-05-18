import { THEKE_CREDITS_MAX_TOPUP_INR, THEKE_CREDITS_MIN_TOPUP_INR } from "./thekeCredits";

export type TopUpAmountValidation =
  | { ok: true; amountInr: number }
  | { ok: false; error: string };

/** Validates a whole-rupee top-up amount for wallet UI and checkout. */
export function validateTopUpAmountInr(raw: string | number): TopUpAmountValidation {
  const trimmed = typeof raw === "string" ? raw.trim() : String(raw);
  if (!trimmed) {
    return { ok: false, error: `Enter at least ₹${THEKE_CREDITS_MIN_TOPUP_INR}` };
  }

  const amountInr = typeof raw === "number" ? raw : Number(trimmed);
  if (!Number.isFinite(amountInr) || !Number.isInteger(amountInr)) {
    return { ok: false, error: "Enter a whole rupee amount (no decimals)" };
  }

  if (amountInr < THEKE_CREDITS_MIN_TOPUP_INR) {
    return { ok: false, error: `Minimum top-up is ₹${THEKE_CREDITS_MIN_TOPUP_INR}` };
  }

  if (amountInr > THEKE_CREDITS_MAX_TOPUP_INR) {
    return { ok: false, error: `Maximum top-up is ₹${THEKE_CREDITS_MAX_TOPUP_INR.toLocaleString("en-IN")}` };
  }

  return { ok: true, amountInr };
}
