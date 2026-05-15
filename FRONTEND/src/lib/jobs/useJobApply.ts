"use client";

import { useEffect, useState } from "react";
import type { ApplicationStatus } from "@/lib/jobs/applications";
import type { FeedJob } from "@/lib/jobs/types";

export function useJobApply(
  job: FeedJob,
  onApplied: (jobId: string, status: ApplicationStatus) => void,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ApplicationStatus | null>(job.applicationStatus ?? null);

  useEffect(() => {
    setStatus(job.applicationStatus ?? null);
  }, [job.applicationStatus, job.id]);

  const isFinal = status === "pending" || status === "approved" || status === "rejected";

  async function handleApply() {
    if (isFinal) return;
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch(`/api/jobs/${job.id}/apply`, { method: "POST" });
      const data = (await resp.json()) as { error?: string; application?: { status: ApplicationStatus } };
      if (!resp.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Could not apply");
      }
      const next = data.application?.status ?? "pending";
      setStatus(next);
      onApplied(job.id, next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const primaryLabel =
    status === "approved"
      ? "Approved"
      : status === "pending"
        ? "Applied"
        : status === "rejected"
          ? "Not selected"
          : "Apply";

  const statusHint =
    status === "pending"
      ? "Request sent. Employer will review on Thekedaar and WhatsApp."
      : status === "approved"
        ? "Approved — see contact on the Applied tab."
        : status === "rejected"
          ? "This application was not selected."
          : null;

  return {
    loading,
    error,
    status,
    primaryLabel,
    statusHint,
    handleApply,
    disabled: isFinal || loading,
  };
}
