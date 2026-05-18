import Link from "next/link";
import type { FeedJob } from "@/lib/jobs/types";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { JOBS_HOME_PATH, loginUrl } from "@/lib/signIn";

const urgencyStyles: Record<FeedJob["urgency"], string> = {
  high: "bg-amber-100 text-amber-900",
  medium: "bg-sky-100 text-sky-900",
  low: "bg-slate-100 text-slate-700",
};

export function JobCard({ job }: { job: FeedJob }) {
  const isPro = job.posterSubscription.plan === "pro";
  const loginHref = loginUrl({
    returnTo: JOBS_HOME_PATH,
    intent: "apply",
    jobId: job.id,
  });

  return (
    <article className="flex h-full w-full min-w-0 flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm shadow-slate-900/5 sm:p-5">
      <div className="grid grid-cols-[1fr_auto] items-start gap-2 gap-y-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-sm font-bold text-brand sm:h-11 sm:w-11">
            {job.employerAvatarKey}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-snug text-foreground">
              {job.title}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-sm text-muted">
              <span>{job.employerDisplayName}</span>
              {isPro ? (
                <span className="ml-1.5 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                  Pro
                </span>
              ) : null}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${urgencyStyles[job.urgency]}`}
        >
          {job.urgency} priority
        </span>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-relaxed text-muted">{job.description}</p>

        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted">City</dt>
            <dd className="mt-0.5 line-clamp-2 break-words font-medium text-foreground">{job.city || "—"}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted">Category</dt>
            <dd className="mt-0.5 line-clamp-2 break-words text-foreground">{job.category}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted">Salary</dt>
            <dd className="mt-0.5 font-semibold text-brand">{formatSalary(job.salaryPerMonth)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted">Posted</dt>
            <dd className="mt-0.5 text-muted">{formatRelativeTime(job.postedAt)}</dd>
          </div>
        </dl>
      </div>

      <Link
        href={loginHref}
        className="mt-4 flex min-h-12 w-full shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-dark"
      >
        Sign in to apply or hire
      </Link>
    </article>
  );
}
