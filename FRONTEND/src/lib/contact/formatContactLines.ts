import { workerOrJobLocation } from "@/lib/location/publicLocation";

export function formatContactLocationLines(opts: {
  city?: string | null;
  sector?: string | null;
  fullAddress?: string | null;
  workAddress?: string | null;
}): string[] {
  const lines: string[] = [];
  const area = workerOrJobLocation({ city: opts.city ?? "", sector: opts.sector });
  if (area && area !== "Location not set") lines.push(area);
  if (opts.workAddress?.trim()) lines.push(opts.workAddress.trim());
  else if (opts.fullAddress?.trim()) lines.push(opts.fullAddress.trim());
  return lines;
}
