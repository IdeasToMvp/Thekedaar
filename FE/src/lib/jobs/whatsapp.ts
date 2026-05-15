import type { JobListing } from "./types";

export function buildWhatsAppUrl(job: JobListing, intent: "apply" | "hire" = "apply"): string {
  const msg =
    intent === "hire"
      ? `Hi, I'm hiring on Thekedaar and interested in your listing "${job.title}" (ref ${job.id}). Can we discuss?`
      : `Hi, I'm interested in "${job.title}" (ref ${job.id}) on Thekedaar. Can we talk?`;
  return `https://wa.me/${job.contactWaDigits}?text=${encodeURIComponent(msg)}`;
}
