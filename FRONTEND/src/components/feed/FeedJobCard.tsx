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
  return (
    <article className="flex h-full min-h-[280px] flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm shadow-slate-900/5 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xl" aria-hidden>
          {categoryIcon(job.category)}
        </span>
        <p className="text-right text-lg font-bold text-brand">{formatSalary(job.salaryPerMonth)}</p>
      </div>

      <h3 className="mt-3 line-clamp-2 text-base font-bold leading-snug text-foreground">{job.title}</h3>
      <p className="mt-1 line-clamp-1 text-sm text-muted">
        {job.city}
        <span className="mx-1 text-border">·</span>
        {job.employerDisplayName}
      </p>
      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">{job.description}</p>

      <p className="mt-2 text-xs text-muted">{formatRelativeTime(job.postedAt)}</p>

      <JobCardActions job={job} user={user} layout="stack" onContactRecorded={onContactRecorded} />
    </article>
  );
}
