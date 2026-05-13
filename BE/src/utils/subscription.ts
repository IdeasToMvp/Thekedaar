export type SubscriptionPlan = "free" | "basic" | "pro";

export function normalizeSubscriptionPlan(raw: unknown): SubscriptionPlan {
  if (raw === "basic" || raw === "pro") return raw;
  return "free";
}

/** API shape for clients; extend `features` when billing adds entitlements. */
export function subscriptionPayload(user: { subscription_plan?: unknown }) {
  return {
    plan: normalizeSubscriptionPlan(user.subscription_plan),
    features: {} as Record<string, boolean>,
  };
}
