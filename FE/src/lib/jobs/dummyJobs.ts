import type { SubscriptionPlan } from "@/lib/subscription";
import type { JobListing } from "./types";

const CATEGORIES = [
  "Maid",
  "Cook",
  "Driver",
  "Security guard",
  "Nanny",
  "Office help",
  "Gardener",
  "Helper",
] as const;

const CITIES = [
  "Delhi NCR",
  "Mumbai",
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
] as const;

const EMPLOYERS = [
  "R. Sharma household",
  "Kapoor family",
  "Green Valley Society",
  "Mrs. Iyer",
  "Tech park canteen",
  "Dr. Menon clinic",
  "Sunrise apartments",
  "Villa 12, Palm Grove",
] as const;

const PLANS: SubscriptionPlan[] = ["free", "free", "free", "basic", "pro"];

const TITLES: Record<(typeof CATEGORIES)[number], string[]> = {
  Maid: ["Full-time house help", "Live-in maid — 6 days", "Part-time morning maid"],
  Cook: ["North Indian cook", "South Indian cook — veg", "Family cook + kitchen help"],
  Driver: ["Personal driver (SUV)", "School pickup driver", "Part-time evening driver"],
  "Security guard": ["Night shift guard", "Society gate — 12h", "Residential security"],
  Nanny: ["Infant care + light chores", "After-school nanny", "Live-in nanny"],
  "Office help": ["Peon + filing", "Office boy — full day", "Reception helper"],
  Gardener: ["Lawn + plants maintenance", "Weekly garden visit", "Full-time gardener"],
  Helper: ["Helper for shifting", "Warehouse helper", "Shop helper — retail"],
};

function posterSubscription(i: number): JobListing["posterSubscription"] {
  const plan = PLANS[i % PLANS.length];
  return {
    plan,
    features: plan === "pro" ? { boosted_listing: true } : {},
  };
}

function waDigits(i: number): string {
  const base = 919_000_000_000;
  return String(base + (i % 99_999_999));
}

export const DUMMY_JOB_LISTINGS: JobListing[] = Array.from({ length: 100 }, (_, i) => {
  const category = CATEGORIES[i % CATEGORIES.length];
  const city = CITIES[(i * 3) % CITIES.length];
  const titles = TITLES[category];
  const title = titles[i % titles.length];
  const employer = EMPLOYERS[i % EMPLOYERS.length];
  const salary = 8_000 + ((i * 173) % 42_000);
  const postedAt = new Date(Date.now() - i * 2.5 * 3_600_000 - (i % 7) * 86_400_000).toISOString();
  const urgency = (["low", "medium", "high"] as const)[i % 3];
  const letter = employer.replace(/^Mrs\. /, "M").slice(0, 1).toUpperCase();

  return {
    id: `demo-job-${String(i + 1).padStart(3, "0")}`,
    title,
    city,
    category,
    salaryPerMonth: salary,
    postedAt,
    employerDisplayName: employer,
    employerAvatarKey: letter,
    description: `${title} in ${city}. ${category} role — timings flexible where possible. Posted via Thekedaar demo feed (ref #${i + 1}).`,
    urgency,
    posterSubscription: posterSubscription(i),
    contactWaDigits: waDigits(i),
  };
});
