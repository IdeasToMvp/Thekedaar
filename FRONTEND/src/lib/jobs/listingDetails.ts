import type { FeedJob } from "./types";

export type JobListingDetailItem = {
  key: string;
  label: string;
  value: string;
};

export function formatUrgencyLabel(job: FeedJob): string {
  const raw = job.urgencyRaw?.trim();
  if (raw) return raw;
  if (job.urgency === "high") return "Immediate";
  if (job.urgency === "medium") return "Within 1 week";
  return "Flexible";
}

export function formatPreferredGender(gender: string | null | undefined): string | null {
  if (!gender || gender === "any") return null;
  if (gender === "male") return "Male only";
  if (gender === "female") return "Female only";
  return gender;
}

/** Candidate requirements: age, gender, documents. */
export function formatCandidateRequirements(job: FeedJob): string | null {
  const bits: string[] = [];
  if (job.minAge != null && job.maxAge != null) bits.push(`Age ${job.minAge}–${job.maxAge}`);
  else if (job.minAge != null) bits.push(`Age ${job.minAge}+`);
  else if (job.maxAge != null) bits.push(`Age up to ${job.maxAge}`);

  const gender = formatPreferredGender(job.preferredGender);
  if (gender) bits.push(gender);

  if (job.requiredDocuments?.includes("aadhaar")) bits.push("Aadhaar required");

  return bits.length > 0 ? bits.join(" · ") : null;
}

/** Structured rows for listing cards (timing, stay, start, candidate requirements). */
export function getJobListingDetailItems(job: FeedJob): JobListingDetailItem[] {
  const items: JobListingDetailItem[] = [];

  if (job.timing?.trim()) {
    items.push({ key: "timing", label: "Timing", value: job.timing.trim() });
  }

  if (job.accommodation === true) {
    items.push({ key: "accommodation", label: "Stay", value: "Accommodation provided" });
  } else if (job.accommodation === false) {
    items.push({ key: "accommodation", label: "Stay", value: "No accommodation" });
  }

  items.push({ key: "urgency", label: "Start", value: formatUrgencyLabel(job) });

  const requirements = formatCandidateRequirements(job);
  if (requirements) {
    items.push({ key: "requirements", label: "Looking for", value: requirements });
  }

  return items;
}
