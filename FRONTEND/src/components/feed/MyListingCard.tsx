"use client";

import type { FeedJob } from "@/lib/jobs/types";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { categoryIcon } from "@/lib/jobs/feedFilters";
import { formatCandidateRequirements, formatUrgencyLabel } from "@/lib/jobs/listingDetails";
import { workerOrJobLocation } from "@/lib/location/publicLocation";
import { ListingStatusBadges } from "@/components/jobs/ListingStatusBadges";
import { MAX_JOB_EDITS } from "@/lib/credits/pricing";

function categoryGradient(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("cook") || c.includes("chef")) return "from-amber-50 to-orange-100";
  if (c.includes("maid") || c.includes("house")) return "from-sky-50 to-blue-100";
  return "from-emerald-50 to-teal-100";
}

function listingSummary(job: FeedJob): string | null {
  const bits: string[] = [];
  if (job.timing?.trim()) bits.push(job.timing.trim());
  if (job.accommodation === true) bits.push("Stay included");
  else if (job.accommodation === false) bits.push("Stay not included");
  bits.push(formatUrgencyLabel(job));
  return bits.length > 0 ? bits.join(" · ") : null;
}

type Props = {
  job: FeedJob;
  onEdit?: (job: FeedJob) => void;
  onClose?: (job: FeedJob) => void;
};

export function MyListingCard({ job, onEdit, onClose }: Props) {
  const closed = job.listingStatus === "closed";
  const canEdit = job.canEdit ?? (!closed && (job.editCount ?? 0) < (job.maxEdits ?? MAX_JOB_EDITS));
  const maxEdits = job.maxEdits ?? MAX_JOB_EDITS;
  const editsUsed = job.editCount ?? 0;

  const location = workerOrJobLocation({
    publicLocation: job.publicLocation,
    city: job.city,
    sector: job.sector,
  });
  const summary = listingSummary(job);
  const requirements = formatCandidateRequirements(job);

  return (
    <article
      className={`flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm ${
        closed ? "border-slate-300 opacity-75 grayscale-[0.35]" : "border-border"
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
            <ListingStatusBadges job={job} className="mb-1" />
            <span className="rounded-full border border-white/70 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-foreground">
              {job.category}
            </span>
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

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2.5 sm:px-4">
        {summary ? <p className="line-clamp-2 text-[11px] leading-snug text-muted">{summary}</p> : null}
        {requirements ? (
          <p className={`line-clamp-1 text-[11px] text-foreground/80 ${summary ? "mt-1" : ""}`}>{requirements}</p>
        ) : null}
        <div className="mt-auto border-t border-border pt-2">
          <p className="text-[10px] text-muted">
            Posted {formatRelativeTime(job.postedAt)}
            {closed && job.closedAt ? ` · Closed ${formatRelativeTime(job.closedAt)}` : closed ? " · Closed" : " · Live on feed"}
            {!closed ? ` · ${editsUsed}/${maxEdits} edits` : null}
          </p>
          {closed && job.hiredWorkerName ? (
            <p className="mt-1 text-[11px] text-foreground">Hired: {job.hiredWorkerName}</p>
          ) : null}
          <div className="mt-2 grid grid-cols-2 gap-2">
            {!closed && onClose ? (
              <button
                type="button"
                onClick={() => onClose(job)}
                className="min-h-9 rounded-full border border-slate-300 bg-slate-50 px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:text-sm"
              >
                Close listing
              </button>
            ) : null}
            {onEdit && !closed ? (
              <button
                type="button"
                onClick={() => onEdit(job)}
                disabled={!canEdit}
                className="min-h-9 rounded-full border border-brand bg-brand/5 px-2 text-xs font-semibold text-brand-dark transition hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              >
                {canEdit ? "Edit listing" : "No edits left"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
