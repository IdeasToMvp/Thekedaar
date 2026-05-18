"use client";

import { useState } from "react";
import type { ApplicationStatus } from "@/lib/jobs/types";
import type { FeedJob, FeedLimits } from "@/lib/jobs/types";
import type { MeUser } from "@/lib/auth/types";
import { primaryJobAction } from "@/lib/jobs/viewerRole";
import { useJobApply } from "@/lib/jobs/useJobApply";
import { useJobContact } from "@/lib/jobs/useJobContact";
import { JobListingViewModal } from "./JobListingViewModal";

type Props = {
  job: FeedJob;
  user: MeUser;
  onApplicationUpdated: (jobId: string, status: ApplicationStatus) => void;
  onContactRecorded?: (jobId: string, limits?: FeedLimits) => void;
};

export function JobCardActions({ job, user, onApplicationUpdated, onContactRecorded }: Props) {
  const closed = job.listingStatus === "closed";
  const action = primaryJobAction(user);
  const apply = useJobApply(job, onApplicationUpdated);
  const hire = useJobContact(job, action === "hire" ? "hire" : null, onContactRecorded ?? (() => {}));
  const [viewOpen, setViewOpen] = useState(false);

  const isApply = action === "apply";
  const loading = isApply ? apply.loading : hire.loading !== null;
  const error = isApply ? apply.error : hire.error;
  const primaryLabel = isApply ? apply.primaryLabel : hire.primaryLabel;
  const handlePrimary = isApply ? apply.handleApply : hire.handlePrimary;
  const showCheck = isApply ? apply.status === "pending" || apply.status === "approved" : hire.contacted;
  const disabled = isApply ? apply.disabled : hire.loading !== null;
  const applyBtnClass =
    apply.status === "rejected"
      ? "min-h-9 flex-1 rounded-full border border-red-200 bg-red-50 text-sm font-semibold text-red-800 disabled:opacity-70"
      : "min-h-9 flex-1 rounded-full bg-brand-dark text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50";

  if (closed) {
    return <p className="mt-auto pt-3 text-xs font-medium text-muted">This listing is closed</p>;
  }

  if (!action) {
    return (
      <p className="mt-auto pt-3 text-xs text-muted">Complete your profile on WhatsApp to apply for jobs.</p>
    );
  }

  return (
    <>
      <div className="mt-auto space-y-2 border-t border-border pt-2">
        {error ? (
          <p className="text-xs text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {isApply && apply.statusHint ? (
          <p className="text-[11px] leading-snug text-muted">{apply.statusHint}</p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewOpen(true)}
            className="min-h-9 flex-1 rounded-full border border-border bg-background text-sm font-semibold text-foreground transition hover:bg-slate-50"
          >
            View listing
          </button>
          <button
            type="button"
            onClick={handlePrimary}
            disabled={disabled}
            className={isApply ? applyBtnClass : "min-h-9 flex-1 rounded-full bg-brand-dark text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"}
          >
            {loading ? "…" : primaryLabel}
            {showCheck ? " ✓" : ""}
          </button>
        </div>
      </div>

      <JobListingViewModal
        open={viewOpen}
        job={job}
        user={user}
        onClose={() => setViewOpen(false)}
        onApplicationUpdated={onApplicationUpdated}
        onContactRecorded={onContactRecorded}
      />
    </>
  );
}
