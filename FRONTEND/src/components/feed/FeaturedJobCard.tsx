import type { FeedJob, FeedLimits } from "@/lib/jobs/types";
import type { MeUser } from "@/lib/auth/types";
import { formatSalary } from "@/lib/formatRelativeTime";
import { JobCardActions } from "./JobCardActions";

function gradientFor(category: string) {
  const c = category.toLowerCase();
  if (c.includes("cook") || c.includes("chef")) return "from-amber-100 to-orange-200";
  if (c.includes("maid") || c.includes("house")) return "from-sky-100 to-blue-200";
  return "from-emerald-100 to-teal-200";
}

type Props = {
  job: FeedJob;
  user: MeUser;
  onContactRecorded: (jobId: string, limits?: FeedLimits) => void;
};

export function FeaturedJobCard({ job, user, onContactRecorded }: Props) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col md:flex-row">
        <div
          className={`flex min-h-[140px] items-center justify-center bg-gradient-to-br md:w-2/5 ${gradientFor(job.category)}`}
        >
          <span className="text-5xl opacity-80" aria-hidden>
            {job.category.toLowerCase().includes("cook") ? "👨‍🍳" : "💼"}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            {job.urgency === "high" ? (
              <span className="rounded-md bg-amber-500 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                Urgent
              </span>
            ) : (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600">
                {job.category}
              </span>
            )}
            <p className="text-2xl font-bold text-foreground">{formatSalary(job.salaryPerMonth)}</p>
          </div>
          <h3 className="mt-2 text-xl font-bold text-foreground">{job.title}</h3>
          <p className="mt-1 text-sm text-muted">
            {job.city}
            <span className="mx-1">·</span>
            {job.employerDisplayName}
          </p>
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{job.description}</p>
          <div className="mt-4">
            <JobCardActions job={job} user={user} layout="featured" onContactRecorded={onContactRecorded} />
          </div>
        </div>
      </div>
    </article>
  );
}
