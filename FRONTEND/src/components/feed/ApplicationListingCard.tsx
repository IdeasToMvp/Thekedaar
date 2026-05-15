"use client";

import type { JobApplication } from "@/lib/jobs/applications";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { categoryIcon } from "@/lib/jobs/feedFilters";
import { workerOrJobLocation } from "@/lib/location/publicLocation";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { ContactDetailsCard } from "./ContactDetailsCard";

function categoryGradient(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("cook") || c.includes("chef")) return "from-amber-50 to-orange-100";
  if (c.includes("maid") || c.includes("house")) return "from-sky-50 to-blue-100";
  return "from-emerald-50 to-teal-100";
}

type Props = {
  app: JobApplication;
  variant: "worker" | "employer";
  onViewListing?: () => void;
  onViewProfile?: () => void;
  onApprove?: () => void;
  onDecline?: () => void;
  acting?: boolean;
};

export function ApplicationListingCard({
  app,
  variant,
  onViewListing,
  onViewProfile,
  onApprove,
  onDecline,
  acting = false,
}: Props) {
  const job = app.job;
  const worker = app.worker;
  const location = workerOrJobLocation({
    publicLocation: job.publicLocation,
    city: job.city,
    sector: job.sector,
  });

  return (
    <article className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm shadow-slate-900/5">
      <div className={`relative bg-gradient-to-br px-3 pb-2.5 pt-3 sm:px-4 ${categoryGradient(job.category)}`}>
        <div className="absolute right-3 top-3 z-10 sm:right-4">
          <ApplicationStatusBadge status={app.status} />
        </div>
        <div className="flex items-start gap-2.5 pr-24">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white text-lg shadow-sm"
            aria-hidden
          >
            {categoryIcon(job.category)}
          </span>
          <div className="min-w-0 flex-1">
            <span className="rounded-full border border-white/70 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-foreground">
              {job.category}
            </span>
            <h3 className="mt-1 line-clamp-2 font-serif text-base font-bold leading-snug text-foreground sm:text-lg">
              {job.title}
            </h3>
            {location && location !== "Location not set" ? (
              <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{location}</p>
            ) : null}
          </div>
        </div>
        <div className="absolute bottom-2.5 right-3 sm:right-4">
          <div className="rounded-lg bg-white/95 px-2 py-1 text-right shadow-sm ring-1 ring-black/5">
            <p className="text-sm font-bold leading-none text-brand">{formatSalary(job.salaryPerMonth)}</p>
            <p className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-muted">per month</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5 sm:px-4">
        <p className="text-[10px] text-muted">Applied {formatRelativeTime(app.appliedAt)}</p>

        {variant === "worker" && app.status === "approved" && app.employerContact ? (
          <ContactDetailsCard
            title="Employer contact"
            name={app.employerContact.name}
            phone={app.employerContact.phone}
            city={app.employerContact.city}
            sector={app.employerContact.sector}
            fullAddress={app.employerContact.fullAddress}
            workAddress={app.employerContact.workAddress}
          />
        ) : null}

        {variant === "worker" && app.status === "pending" ? (
          <p className="mt-3 rounded-xl border border-border bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-muted">
            Waiting for employer approval. You will get WhatsApp when approved.
          </p>
        ) : null}

        {variant === "worker" && app.status === "rejected" ? (
          <p className="mt-3 rounded-xl border border-border bg-slate-50 px-3 py-2.5 text-xs text-muted">
            This employer did not select your application.
          </p>
        ) : null}

        {variant === "employer" && worker && app.status === "approved" && worker.phone ? (
          <ContactDetailsCard
            title="Worker contact"
            name={worker.name}
            phone={worker.phone}
            city={worker.city}
            sector={worker.sector}
            fullAddress={worker.fullAddress}
          />
        ) : null}

        {variant === "employer" && worker && (app.status === "pending" || app.status === "rejected") ? (
          <div className="mt-3 rounded-xl border border-border bg-slate-50 px-3 py-2.5 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Applicant</p>
            <p className="mt-1 font-medium text-foreground">{worker.name}</p>
            <p className="text-xs text-muted">
              {worker.skills.join(", ") || "—"}
              {worker.experienceYears != null ? ` · ${worker.experienceYears} yrs exp` : ""}
            </p>
            {app.status === "pending" ? (
              <p className="mt-1 text-xs text-muted">Phone and address unlock after you approve</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto space-y-2 pt-3">
          {variant === "worker" && onViewListing ? (
            <button
              type="button"
              onClick={onViewListing}
              className="min-h-9 w-full rounded-full border border-border bg-background text-sm font-semibold text-foreground transition hover:bg-slate-50"
            >
              View listing
            </button>
          ) : null}

          {variant === "employer" && app.status === "pending" && onDecline && onApprove ? (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={acting}
                onClick={onDecline}
                className="min-h-9 flex-1 rounded-full border border-border text-sm font-semibold text-foreground disabled:opacity-50"
              >
                Decline
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={onApprove}
                className="min-h-9 flex-1 rounded-full bg-brand-dark text-sm font-semibold text-white disabled:opacity-50"
              >
                {acting ? "…" : "Approve"}
              </button>
            </div>
          ) : null}

          {variant === "employer" &&
          (app.status === "approved" || app.status === "rejected") &&
          onViewProfile ? (
            <div className="flex gap-2">
              {onViewListing ? (
                <button
                  type="button"
                  onClick={onViewListing}
                  className="min-h-9 flex-1 rounded-full border border-border bg-background text-sm font-semibold text-foreground transition hover:bg-slate-50"
                >
                  View listing
                </button>
              ) : null}
              <button
                type="button"
                onClick={onViewProfile}
                className="min-h-9 flex-1 rounded-full bg-brand-dark text-sm font-semibold text-white transition hover:opacity-95"
              >
                View profile
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
