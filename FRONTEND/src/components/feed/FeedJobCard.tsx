"use client";

import Link from "next/link";
import type { FeedJob, FeedLimits } from "@/lib/jobs/types";
import type { MeUser } from "@/lib/auth/types";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { categoryIcon } from "@/lib/jobs/feedFilters";
import { workerOrJobLocation } from "@/lib/location/publicLocation";
import { JobCardActions } from "./JobCardActions";

function categoryGradient(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("cook") || c.includes("chef")) return "from-amber-50 to-orange-100";
  if (c.includes("maid") || c.includes("house")) return "from-sky-50 to-blue-100";
  return "from-emerald-50 to-teal-100";
}

type Props = {
  job: FeedJob;
  user: MeUser;
  onContactRecorded: (jobId: string, limits?: FeedLimits) => void;
};

export function FeedJobCard({ job, user, onContactRecorded }: Props) {
  const own = Boolean(job.isOwnListing);
  const location = workerOrJobLocation({
    publicLocation: job.publicLocation,
    city: job.city,
    sector: job.sector,
  });

  return (
    <article
      className={`flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm shadow-slate-900/5 ${
        own ? "border-brand/40 ring-1 ring-brand/20" : "border-border"
      }`}
    >
      <div className={`relative px-3 pb-2.5 pt-3 sm:px-4 bg-gradient-to-br ${categoryGradient(job.category)}`}>
        <div className="flex items-start gap-2.5 pr-[5.5rem]">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white text-lg shadow-sm"
            aria-hidden
          >
            {categoryIcon(job.category)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1">
              {job.urgency === "high" && !own ? (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                  Urgent
                </span>
              ) : null}
              {own ? (
                <span className="rounded-full bg-brand/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand-dark">
                  Yours
                </span>
              ) : null}
              <span className="rounded-full border border-white/70 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                {job.category}
              </span>
            </div>
            <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-foreground">{job.title}</h3>
            {location && location !== "Location not set" ? (
              <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{location}</p>
            ) : null}
          </div>
        </div>
        <div className="absolute right-3 top-3 sm:right-4">
          <div className="rounded-lg bg-white/95 px-2 py-1 text-right shadow-sm ring-1 ring-black/5">
            <p className="text-sm font-bold leading-none text-brand">{formatSalary(job.salaryPerMonth)}</p>
            <p className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-muted">per month</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-2 sm:px-4">
        <p className="text-[10px] text-muted">Posted {formatRelativeTime(job.postedAt)}</p>

        {own ? (
          <div className="mt-auto pt-2">
            <Link
              href="/feed/my-listings"
              className="flex min-h-9 w-full items-center justify-center rounded-full border border-brand bg-brand/5 text-sm font-semibold text-brand-dark transition hover:bg-brand/10"
            >
              Manage listing
            </Link>
          </div>
        ) : (
          <JobCardActions job={job} user={user} onContactRecorded={onContactRecorded} />
        )}
      </div>
    </article>
  );
}
