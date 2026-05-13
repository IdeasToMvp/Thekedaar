export type SubscriptionPlan = "free" | "basic" | "pro";

export type SubscriptionSnapshot = {
  plan: SubscriptionPlan;
  /** Future: server-driven toggles e.g. `priority_apply`, `see_salary`. */
  features: Record<string, boolean>;
};

export const DEFAULT_SUBSCRIPTION: SubscriptionSnapshot = { plan: "free", features: {} };

export function normalizeSubscriptionFromApi(raw: unknown): SubscriptionSnapshot {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SUBSCRIPTION };
  const plan = (raw as { plan?: unknown }).plan;
  const features = (raw as { features?: unknown }).features;
  const p = plan === "basic" || plan === "pro" ? plan : "free";
  const f =
    features && typeof features === "object" && !Array.isArray(features)
      ? (features as Record<string, boolean>)
      : {};
  return { plan: p, features: f };
}

/** Hook for later: hide premium CTAs, cap applies per day, etc. */
export function viewerCanUseWhatsApply(_viewer: SubscriptionSnapshot, _job: { posterSubscription: SubscriptionSnapshot }): {
  apply: boolean;
  whatsapp: boolean;
} {
  return { apply: true, whatsapp: true };
}

export function posterListingLabel(poster: SubscriptionSnapshot): string | null {
  if (poster.plan === "pro") return "Pro";
  if (poster.plan === "basic") return "Plus";
  return null;
}
