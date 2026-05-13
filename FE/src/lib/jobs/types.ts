import type { SubscriptionSnapshot } from "@/lib/subscription";

export type JobListing = {
  id: string;
  title: string;
  city: string;
  category: string;
  salaryPerMonth: number;
  postedAt: string;
  employerDisplayName: string;
  /** Single char or emoji for avatar placeholder */
  employerAvatarKey: string;
  description: string;
  urgency: "low" | "medium" | "high";
  /** Recruiter-side plan — drives boosted badges / future listing limits */
  posterSubscription: SubscriptionSnapshot;
  /** E.164 without + for wa.me */
  contactWaDigits: string;
};

export type JobSortKey = "newest" | "salary_high" | "salary_low";
