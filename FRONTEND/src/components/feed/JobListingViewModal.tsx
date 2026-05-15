"use client";

import { useEffect } from "react";
import type { FeedJob, FeedLimits } from "@/lib/jobs/types";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { categoryIcon } from "@/lib/jobs/feedFilters";
import { formatUrgencyLabel } from "@/lib/jobs/listingDetails";
import { useJobContact } from "@/lib/jobs/useJobContact";
import { primaryJobAction } from "@/lib/jobs/viewerRole";
import type { MeUser } from "@/lib/auth/types";
import { workerOrJobLocation } from "@/lib/location/publicLocation";
import { JobListingMeta } from "./JobListingMeta";

type Props = {
  open: boolean;
  job: FeedJob | null;
  user: MeUser;
  onClose: () => void;
  onContactRecorded: (jobId: string, limits?: FeedLimits) => void;
};

const STUB_JOB: FeedJob = {
  id: "",
  title: "",
  category: "",
  city: "",
  salaryPerMonth: 0,
  employerDisplayName: "",
  employerAvatarKey: "?",
  description: "",
  postedAt: new Date(0).toISOString(),
  urgency: "low",
  posterSubscription: { plan: "free", features: {} },
};

function isBoilerplateDescription(job: FeedJob): boolean {
  const d = (job.description ?? "").trim().toLowerCase();
  if (!d) return true;
  if (d.length < 40 && d.includes(job.city.toLowerCase()) && d.includes(job.category.toLowerCase())) return true;
  return false;
}

export function JobListingViewModal({ open, job, user, onClose, onContactRecorded }: Props) {
  const activeJob = job ?? STUB_JOB;
  const action = job ? primaryJobAction(user) : null;
  const { loading, error, contacted, canWhatsApp, primaryLabel, handlePrimary, handleWhatsApp, hasAction } =
    useJobContact(activeJob, action, onContactRecorded);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !job) return null;

  const location = workerOrJobLocation({
    publicLocation: job.publicLocation,
    city: job.city,
    sector: job.sector,
  });
  const showDescription = job.description?.trim() && !isBoilerplateDescription(job);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-listing-view-title"
    >
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface shadow-xl sm:rounded-2xl">
        <div className="shrink-0 border-b border-border bg-gradient-to-br from-slate-50 to-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white bg-white text-2xl shadow-sm"
              aria-hidden
            >
              {categoryIcon(job.category)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{job.category}</p>
              <h2 id="job-listing-view-title" className="font-serif text-xl font-bold text-foreground">
                {job.title}
              </h2>
              {location && location !== "Location not set" ? (
                <p className="mt-0.5 text-sm text-muted">{location}</p>
              ) : null}
              <p className="mt-1 text-sm text-muted">{job.employerDisplayName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-muted hover:bg-white/80 hover:text-foreground"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="mt-3 text-lg font-bold text-brand">{formatSalary(job.salaryPerMonth)}/mo</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <JobListingMeta job={job} />

          {showDescription ? (
            <section className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">About this role</p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">{job.description}</p>
            </section>
          ) : null}

          <p className="mt-4 text-[11px] text-muted">
            Posted {formatRelativeTime(job.postedAt)}
            {job.urgency === "high" ? (
              <span className="font-medium text-amber-800"> · {formatUrgencyLabel(job)}</span>
            ) : null}
          </p>

          {hasAction && canWhatsApp ? (
            <section className="mt-5 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#128C7E]">Contact employer</p>
              <p className="mt-1 text-xs text-muted">Reach out on WhatsApp after applying.</p>
              <button
                type="button"
                onClick={handleWhatsApp}
                disabled={!canWhatsApp || loading !== null}
                className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-[#25D366] bg-white text-sm font-semibold text-[#128C7E] transition hover:bg-[#25D366]/10 disabled:opacity-50"
              >
                {loading === "whatsapp" ? "…" : "WhatsApp employer"}
              </button>
            </section>
          ) : null}

          {error ? (
            <p className="mt-3 text-xs text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-border px-5 py-4">
          {hasAction ? (
            <button
              type="button"
              onClick={handlePrimary}
              disabled={loading !== null}
              className="min-h-11 w-full rounded-full bg-brand-dark text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading === action ? "…" : primaryLabel}
              {contacted ? " ✓" : ""}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 w-full rounded-full border border-border bg-background text-sm font-semibold text-foreground"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
