import type { FeedJob } from "@/lib/jobs/types";
import { getJobListingDetailItems } from "@/lib/jobs/listingDetails";

type Props = {
  job: FeedJob;
  /** Tighter spacing for grid cards */
  compact?: boolean;
  className?: string;
};

export function JobListingMeta({ job, compact = false, className = "" }: Props) {
  const items = getJobListingDetailItems(job);
  if (items.length === 0) return null;

  return (
    <ul
      className={`list-none space-y-1 ${compact ? "text-xs" : "text-sm"} ${className}`.trim()}
      aria-label="Job details"
    >
      {items.map((item) => (
        <li key={item.key} className="flex gap-1.5 leading-snug">
          <span className="shrink-0 font-medium text-muted">{item.label}:</span>
          <span className="min-w-0 text-foreground">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
