"use client";

import type { FeedJob } from "@/lib/jobs/types";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { categoryIcon } from "@/lib/jobs/feedFilters";
import { formatUrgencyLabel } from "@/lib/jobs/listingDetails";
import { workerOrJobLocation } from "@/lib/location/publicLocation";
import { JobListingMeta } from "./JobListingMeta";

function categoryGradient(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("cook") || c.includes("chef")) return "from-amber-50 to-orange-100";
  if (c.includes("maid") || c.includes("house")) return "from-sky-50 to-blue-100";
  return "from-emerald-50 to-teal-100";
}

type Props = {
  job: FeedJob;
  onEdit?: (job: FeedJob) => void;
};

export function MyListingCard({ job, onEdit }: Props) {
  const location = workerOrJobLocation({
    publicLocation: job.publicLocation,
    city: job.city,
    sector: job.sector,
  });

  return (
    <article className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className={`px-4 pb-3 pt-4 sm:px-5 bg-gradient-to-br ${categoryGradient(job.category)}`}>
        <div className="flex items-start justify-between gap-2">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white text-xl shadow-sm"
            aria-hidden
          >
            {categoryIcon(job.category)}
          </span>
          <div className="rounded-xl bg-white/95 px-2.5 py-1.5 text-right shadow-sm ring-1 ring-black/5">
            <p className="text-base font-bold leading-none text-brand">{formatSalary(job.salaryPerMonth)}</p>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                job.urgency === "high" ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"
              }`}
            >
              {formatUrgencyLabel(job)}
            </span>
          </div>
        </div>
        <h3 className="mt-3 line-clamp-2 text-base font-bold text-foreground">{job.title}</h3>
        {location && location !== "Location not set" ? (
          <p className="mt-0.5 text-xs text-muted">{location}</p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3 sm:px-5">
        <JobListingMeta job={job} />
        <p className="mt-3 text-[11px] text-muted">Posted {formatRelativeTime(job.postedAt)} · Live on feed</p>
        {onEdit ? (
          <button
            type="button"
            onClick={() => onEdit(job)}
            className="mt-3 min-h-10 w-full rounded-xl border border-brand bg-brand/5 text-sm font-semibold text-brand-dark transition hover:bg-brand/10"
          >
            Edit listing
          </button>
        ) : null}
      </div>
    </article>
  );
}
