import Link from "next/link";
import type { ApplicationStatus, FeedJob } from "@/lib/jobs/types";
import type { MeUser } from "@/lib/auth/types";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { categoryIcon } from "@/lib/jobs/feedFilters";
import { formatUrgencyLabel } from "@/lib/jobs/listingDetails";
import { workerOrJobLocation } from "@/lib/location/publicLocation";
import { JobCardActions } from "./JobCardActions";
import { JobListingMeta } from "./JobListingMeta";

function gradientFor(category: string) {
  const c = category.toLowerCase();
  if (c.includes("cook") || c.includes("chef")) return "from-amber-100 via-amber-50 to-orange-100";
  if (c.includes("maid") || c.includes("house")) return "from-sky-100 via-sky-50 to-blue-100";
  return "from-emerald-100 via-emerald-50 to-teal-100";
}

type Props = {
  job: FeedJob;
  user: MeUser;
  onApplicationUpdated: (jobId: string, status: ApplicationStatus) => void;
};

export function FeaturedJobCard({ job, user, onApplicationUpdated }: Props) {
  const own = Boolean(job.isOwnListing);
  const location = workerOrJobLocation({
    publicLocation: job.publicLocation,
    city: job.city,
    sector: job.sector,
  });

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-surface shadow-md ${own ? "border-brand/40 ring-1 ring-brand/20" : "border-border"}`}
    >
      <div className="flex flex-col md:flex-row">
        <div
          className={`flex min-h-[120px] flex-col items-center justify-center bg-gradient-to-br px-6 md:w-[38%] md:min-h-0 ${gradientFor(job.category)}`}
        >
          <span className="text-5xl drop-shadow-sm" aria-hidden>
            {categoryIcon(job.category)}
          </span>
          <span className="mt-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-foreground">
            {job.category}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {job.urgency === "high" && !own ? (
                <span className="mb-1 inline-block rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Featured · Urgent
                </span>
              ) : (
                <span className="mb-1 inline-block rounded-full bg-brand/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
                  Featured
                </span>
              )}
              <h3 className="text-xl font-bold text-foreground md:text-2xl">{job.title}</h3>
              {location && location !== "Location not set" ? (
                <p className="mt-1 text-sm text-muted">{location}</p>
              ) : null}
              <p className="mt-0.5 text-sm text-muted">{own ? "Your listing" : job.employerDisplayName}</p>
            </div>
            <div className="shrink-0 rounded-2xl bg-slate-50 px-4 py-2 text-right ring-1 ring-border">
              <p className="text-2xl font-bold text-brand">{formatSalary(job.salaryPerMonth)}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted">per month</p>
            </div>
          </div>

          <JobListingMeta job={job} className="mt-4" />

          <p className="mt-3 text-xs text-muted">
            Posted {formatRelativeTime(job.postedAt)}
            <span className="mx-1">·</span>
            {formatUrgencyLabel(job)}
          </p>

          <div className="mt-4">
            {own ? (
              <Link
                href="/feed/my-listings"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand bg-brand/5 px-6 text-sm font-semibold text-brand-dark transition hover:bg-brand/10"
              >
                Manage in My Listings
              </Link>
            ) : (
              <JobCardActions job={job} user={user} onApplicationUpdated={onApplicationUpdated} />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
