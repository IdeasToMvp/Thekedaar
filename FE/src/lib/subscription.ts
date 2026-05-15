import type { FeedLimits } from "./planLimits";

export type SubscriptionPlan = "free" | "basic" | "pro";

export type SubscriptionSnapshot = {
  plan: SubscriptionPlan;
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

export function posterListingLabel(poster: SubscriptionSnapshot): string | null {
  if (poster.plan === "pro") return "Pro";
  if (poster.plan === "basic") return "Plus";
  return null;
}

export function canContactMoreJobs(limits: FeedLimits | null): boolean {
  if (!limits) return true;
  return limits.feedContacts.remaining > 0;
}
