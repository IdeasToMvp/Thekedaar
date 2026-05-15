"use client";

import { useState } from "react";
import type { FeedJob, FeedLimits } from "@/lib/jobs/types";
import type { MeUser } from "@/lib/auth/types";
import { primaryJobAction } from "@/lib/jobs/viewerRole";
import { useJobContact } from "@/lib/jobs/useJobContact";
import { JobListingViewModal } from "./JobListingViewModal";

type Props = {
  job: FeedJob;
  user: MeUser;
  onContactRecorded: (jobId: string, limits?: FeedLimits) => void;
};

export function JobCardActions({ job, user, onContactRecorded }: Props) {
  const action = primaryJobAction(user);
  const { loading, error, contacted, primaryLabel, handlePrimary, hasAction } = useJobContact(
    job,
    action,
    onContactRecorded,
  );
  const [viewOpen, setViewOpen] = useState(false);

  if (!hasAction) {
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
            disabled={loading !== null}
            className="min-h-9 flex-1 rounded-full bg-brand-dark text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
          >
            {loading === action ? "…" : primaryLabel}
            {contacted ? " ✓" : ""}
          </button>
        </div>
      </div>

      <JobListingViewModal
        open={viewOpen}
        job={job}
        user={user}
        onClose={() => setViewOpen(false)}
        onContactRecorded={onContactRecorded}
      />
    </>
  );
}
