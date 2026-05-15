"use client";

import { useState } from "react";
import type { FeedJob, FeedLimits } from "@/lib/jobs/types";
import type { PrimaryJobAction } from "@/lib/jobs/viewerRole";
import { applyMessage, buildWhatsAppUrl, hireMessage } from "@/lib/jobs/whatsapp";

export function useJobContact(
  job: FeedJob,
  primaryAction: PrimaryJobAction | null,
  onContactRecorded: (jobId: string, limits?: FeedLimits) => void,
) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contacted, setContacted] = useState(false);

  const waDigits = job.contactWaDigits?.replace(/\D/g, "") ?? "";
  const canWhatsApp = waDigits.length >= 10;

  async function recordContact(action: "apply" | "hire" | "whatsapp") {
    const resp = await fetch(`/api/jobs/${job.id}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(typeof data?.error === "string" ? data.error : "Could not complete action");
    }
    setContacted(true);
    onContactRecorded(job.id, data.limits as FeedLimits | undefined);
    return data;
  }

  async function handlePrimary() {
    if (!primaryAction) return;
    setError(null);
    setLoading(primaryAction);
    try {
      await recordContact(primaryAction);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function handleWhatsApp() {
    if (!canWhatsApp) {
      setError("WhatsApp not available for this listing.");
      return;
    }
    setError(null);
    setLoading("whatsapp");
    try {
      if (!contacted) await recordContact("whatsapp");
      const msg =
        primaryAction === "hire"
          ? hireMessage(job.title, job.city)
          : applyMessage(job.title, job.city);
      window.open(buildWhatsAppUrl(waDigits, msg), "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  const primaryLabel = primaryAction === "hire" ? "Hire" : "Apply";

  return {
    loading,
    error,
    contacted,
    canWhatsApp,
    primaryLabel,
    handlePrimary,
    handleWhatsApp,
    hasAction: Boolean(primaryAction),
  };
}
