import type { JobListing } from "./types";

export function buildWhatsAppUrl(job: JobListing): string {
  const text = encodeURIComponent(
    `Hi, I'm interested in "${job.title}" (${job.id}) on Thekedaar. Can we talk?`,
  );
  return `https://wa.me/${job.contactWaDigits}?text=${text}`;
}
