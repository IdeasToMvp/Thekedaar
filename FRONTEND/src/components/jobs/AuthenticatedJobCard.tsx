"use client";

import { useState } from "react";
import type { MeUser } from "@/lib/auth/types";
import type { FeedJob, FeedLimits } from "@/lib/jobs/types";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { formatCandidateRequirements, formatUrgencyLabel } from "@/lib/jobs/listingDetails";
import { workerOrJobLocation } from "@/lib/location/publicLocation";
import { applyMessage, buildWhatsAppUrl, hireMessage } from "@/lib/jobs/whatsapp";

const urgencyStyles: Record<FeedJob["urgency"], string> = {
  high: "bg-amber-100 text-amber-900",
  medium: "bg-sky-100 text-sky-900",
  low: "bg-slate-100 text-slate-700",
};

type Props = {
  job: FeedJob;
  user: MeUser;
  contacted: boolean;
  contactsRemaining: number;
  onContactRecorded: (jobId: string, limits?: FeedLimits) => void;
};

function primaryAction(user: MeUser): "apply" | "hire" | null {
  if (user.can_seek && user.can_hire) {
    return user.current_mode === "recruiter" ? "hire" : "apply";
  }
  if (user.can_seek) return "apply";
  if (user.can_hire) return "hire";
  return null;
}

export function AuthenticatedJobCard({
  job,
  user,
  contacted,
  contactsRemaining,
  onContactRecorded,
}: Props) {
  const isPro = job.posterSubscription.plan === "pro";
  const action = primaryAction(user);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const waDigits = job.contactWaDigits?.replace(/\D/g, "") ?? "";
  const canWhatsApp = waDigits.length >= 10;

  async function recordContact(contactAction: "apply" | "hire" | "whatsapp") {
    const resp = await fetch(`/api/jobs/${job.id}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: contactAction }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(typeof data?.error === "string" ? data.error : "Could not record contact");
    }
    onContactRecorded(job.id, data.limits as FeedLimits | undefined);
    return data;
  }

  async function handlePrimary() {
    if (!action) return;
    setError(null);
    setLoading(action);
    try {
      await recordContact(action);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function handleWhatsApp() {
    if (!canWhatsApp) {
      setError("WhatsApp number not available for this listing.");
      return;
    }
    setError(null);
    setLoading("whatsapp");
    try {
      if (!contacted && contactsRemaining <= 0) {
        throw new Error("You have reached your job contact limit for this plan.");
      }
      if (!contacted) {
        await recordContact("whatsapp");
      }
      const msg =
        action === "hire"
          ? hireMessage(job.title, job.city)
          : applyMessage(job.title, job.city);
      window.open(buildWhatsAppUrl(waDigits, msg), "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  const primaryLabel = action === "hire" ? "Hire" : "Apply";
  const disabled = !action || (!contacted && contactsRemaining <= 0);

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
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${urgencyStyles[job.urgency]}`}
        >
          {formatUrgencyLabel(job)}
        </span>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-relaxed text-muted">{job.description}</p>

        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted">City</dt>
            <dd className="mt-0.5 line-clamp-2 break-words font-medium text-foreground">
              {workerOrJobLocation({ publicLocation: job.publicLocation, city: job.city, sector: job.sector })}
            </dd>
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
            <dt className="text-xs font-medium text-muted">Start</dt>
            <dd className="mt-0.5 text-foreground">{formatUrgencyLabel(job)}</dd>
          </div>
          {job.timing?.trim() ? (
            <div className="col-span-2 min-w-0">
              <dt className="text-xs font-medium text-muted">Timing</dt>
              <dd className="mt-0.5 break-words text-foreground">{job.timing}</dd>
            </div>
          ) : null}
          {job.accommodation != null ? (
            <div className="min-w-0">
              <dt className="text-xs font-medium text-muted">Stay</dt>
              <dd className="mt-0.5 text-foreground">{job.accommodation ? "Provided" : "Not provided"}</dd>
            </div>
          ) : null}
          {formatCandidateRequirements(job) ? (
            <div className={job.accommodation != null ? "min-w-0" : "col-span-2 min-w-0"}>
              <dt className="text-xs font-medium text-muted">Looking for</dt>
              <dd className="mt-0.5 break-words text-foreground">{formatCandidateRequirements(job)}</dd>
            </div>
          ) : null}
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted">Posted</dt>
            <dd className="mt-0.5 text-muted">{formatRelativeTime(job.postedAt)}</dd>
          </div>
        </dl>
      </div>

      {!action ? (
        <p className="mt-4 text-xs text-muted">
          Complete your profile on WhatsApp (worker or employer) to apply or hire from the feed.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrimary}
              disabled={disabled || loading !== null}
              className="flex min-h-11 items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === action ? "…" : primaryLabel}
              {contacted ? " ✓" : ""}
            </button>
            <button
              type="button"
              onClick={handleWhatsApp}
              disabled={!canWhatsApp || loading !== null || disabled}
              className="flex min-h-11 items-center justify-center rounded-xl border border-[#25D366] bg-[#25D366]/10 text-sm font-semibold text-[#128C7E] transition hover:bg-[#25D366]/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === "whatsapp" ? "…" : "WhatsApp"}
            </button>
          </div>
          {error ? (
            <p className="text-xs font-medium text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </article>
  );
}
