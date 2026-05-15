import type { FeedJob } from "./types";
import type { FeedDetailCell } from "@/components/feed/FeedDetailGrid";

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

export function getJobDetailCells(job: FeedJob): FeedDetailCell[] {
  const items: FeedDetailCell[] = [];

  if (job.timing?.trim()) {
    items.push({ key: "timing", label: "Timing", value: job.timing.trim(), fullWidth: job.timing.length > 24 });
  }

  if (job.accommodation === true) {
    items.push({ key: "accommodation", label: "Stay", value: "Included", tone: "success" });
  } else if (job.accommodation === false) {
    items.push({ key: "accommodation", label: "Stay", value: "Not included", tone: "muted" });
  }

  const start = formatUrgencyLabel(job);
  items.push({
    key: "urgency",
    label: "Start",
    value: start,
    tone: job.urgency === "high" ? "warning" : "default",
  });

  return items;
}

export function getJobRequirementCells(job: FeedJob): FeedDetailCell[] {
  const req = formatCandidateRequirements(job);
  if (!req) return [];
  return [{ key: "requirements", label: "Looking for", value: req, fullWidth: true }];
}
