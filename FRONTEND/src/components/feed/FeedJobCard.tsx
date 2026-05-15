"use client";

import Link from "next/link";
import type { FeedJob, FeedLimits } from "@/lib/jobs/types";
import type { MeUser } from "@/lib/auth/types";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { categoryIcon } from "@/lib/jobs/feedFilters";
import { JobCardActions } from "./JobCardActions";

type Props = {
  job: FeedJob;
  user: MeUser;
  onContactRecorded: (jobId: string, limits?: FeedLimits) => void;
};

export function FeedJobCard({ job, user, onContactRecorded }: Props) {
  const own = Boolean(job.isOwnListing);

  return (
    <article
      className={`flex h-full w-full flex-col rounded-2xl border bg-surface p-4 shadow-sm shadow-slate-900/5 sm:p-5 ${
        own ? "border-brand/40 ring-1 ring-brand/20" : "border-border"
      }`}
    >
      <div className="flex shrink-0 items-start justify-between gap-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xl" aria-hidden>
          {categoryIcon(job.category)}
        </span>
        <div className="text-right">
          {own ? (
            <span className="mb-1 inline-block rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
              Your listing
            </span>
          ) : null}
          <p className="text-lg font-bold text-brand">{formatSalary(job.salaryPerMonth)}</p>
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 min-h-[2.75rem] text-base font-bold leading-snug text-foreground">{job.title}</h3>
      <p className="mt-1 line-clamp-1 text-sm text-muted">
        {job.city}
        <span className="mx-1 text-border">·</span>
        {own ? "You" : job.employerDisplayName}
      </p>
      <p className="mt-2 line-clamp-3 min-h-[3.75rem] flex-1 text-sm leading-relaxed text-muted">{job.description}</p>

      <p className="mt-2 shrink-0 text-xs text-muted">{formatRelativeTime(job.postedAt)}</p>

      {own ? (
        <div className="mt-auto pt-3">
          <Link
            href="/feed/my-listings"
            className="flex min-h-11 w-full items-center justify-center rounded-lg border border-brand bg-brand/5 text-sm font-semibold text-brand-dark transition hover:bg-brand/10"
          >
            Manage in My Listings
          </Link>
        </div>
      ) : (
        <JobCardActions job={job} user={user} layout="stack" onContactRecorded={onContactRecorded} />
      )}
    </article>
  );
}
