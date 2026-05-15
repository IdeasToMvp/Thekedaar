"use client";

import Link from "next/link";
import type { FeedJob, FeedLimits } from "@/lib/jobs/types";
import type { MeUser } from "@/lib/auth/types";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { categoryIcon } from "@/lib/jobs/feedFilters";
import { formatUrgencyLabel } from "@/lib/jobs/listingDetails";
import { workerOrJobLocation } from "@/lib/location/publicLocation";
import { JobCardActions } from "./JobCardActions";
import { JobListingMeta } from "./JobListingMeta";

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

function isBoilerplateDescription(job: FeedJob): boolean {
  const d = (job.description ?? "").trim().toLowerCase();
  if (!d) return true;
  if (d.length < 40 && d.includes(job.city.toLowerCase()) && d.includes(job.category.toLowerCase())) return true;
  return false;
}

export function FeedJobCard({ job, user, onContactRecorded }: Props) {
  const own = Boolean(job.isOwnListing);
  const location = workerOrJobLocation({
    publicLocation: job.publicLocation,
    city: job.city,
    sector: job.sector,
  });
  const showDescription = job.description?.trim() && !isBoilerplateDescription(job);

  return (
    <article
      className={`flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm shadow-slate-900/5 ${
        own ? "border-brand/40 ring-1 ring-brand/20" : "border-border"
      }`}
    >
      <div className={`relative px-4 pb-3 pt-4 sm:px-5 bg-gradient-to-br ${categoryGradient(job.category)}`}>
        <div className="flex items-start gap-3 pr-24">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white text-2xl shadow-sm"
            aria-hidden
          >
            {categoryIcon(job.category)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {job.urgency === "high" && !own ? (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Urgent
                </span>
              ) : null}
              {own ? (
                <span className="rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
                  Your listing
                </span>
              ) : null}
              <span className="rounded-full border border-white/70 bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                {job.category}
              </span>
            </div>
            <h3 className="mt-1.5 line-clamp-2 text-base font-bold leading-snug text-foreground">{job.title}</h3>
            {location && location !== "Location not set" ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted">{location}</p>
            ) : null}
            {!own ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted/80">{job.employerDisplayName}</p>
            ) : null}
          </div>
        </div>
        <div className="absolute right-4 top-4 sm:right-5">
          <div className="rounded-xl bg-white/95 px-2.5 py-1.5 text-right shadow-sm ring-1 ring-black/5">
            <p className="text-base font-bold leading-none text-brand">{formatSalary(job.salaryPerMonth)}</p>
            <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-muted">per month</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3 sm:px-5">
        <JobListingMeta job={job} />

        {showDescription ? (
          <p className="mt-2 line-clamp-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs leading-relaxed text-muted">
            {job.description}
          </p>
        ) : null}

        <p className="mt-3 text-[11px] text-muted">
          Posted {formatRelativeTime(job.postedAt)}
          {job.urgency === "high" ? (
            <span className="font-medium text-amber-800"> · {formatUrgencyLabel(job)}</span>
          ) : null}
        </p>

        {own ? (
          <div className="mt-auto pt-3">
            <Link
              href="/feed/my-listings"
              className="flex min-h-11 w-full items-center justify-center rounded-xl border border-brand bg-brand/5 text-sm font-semibold text-brand-dark transition hover:bg-brand/10"
            >
              Manage in My Listings
            </Link>
          </div>
        ) : (
          <JobCardActions job={job} user={user} layout="stack" onContactRecorded={onContactRecorded} />
        )}
      </div>
    </article>
  );
}
