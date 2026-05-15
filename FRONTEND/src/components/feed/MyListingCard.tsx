import type { FeedJob } from "@/lib/jobs/types";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { categoryIcon } from "@/lib/jobs/feedFilters";

const urgencyStyles: Record<FeedJob["urgency"], string> = {
  high: "bg-amber-100 text-amber-900",
  medium: "bg-sky-100 text-sky-900",
  low: "bg-slate-100 text-slate-700",
};

type Props = {
  job: FeedJob;
};

export function MyListingCard({ job }: Props) {
  return (
    <article className="flex h-full w-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex shrink-0 items-start justify-between gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-lg" aria-hidden>
          {categoryIcon(job.category)}
        </span>
        <div className="text-right">
          <p className="text-lg font-bold text-brand">{formatSalary(job.salaryPerMonth)}</p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${urgencyStyles[job.urgency]}`}>
            {job.urgency}
          </span>
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 text-base font-bold text-foreground">{job.title}</h3>
      <p className="mt-1 text-sm text-muted">
        {job.category}
        <span className="mx-1">·</span>
        {job.city}
      </p>
      <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">{job.description}</p>
      <p className="mt-3 text-xs text-muted">Posted {formatRelativeTime(job.postedAt)} · Live on feed</p>
    </article>
  );
}
