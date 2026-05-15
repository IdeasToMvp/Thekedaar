"use client";

import { useState } from "react";
import type { FeedWorker } from "@/lib/workers/types";
import type { MeUser } from "@/lib/auth/types";
import { isRecruiterView } from "@/lib/jobs/viewerRole";
import { buildWhatsAppUrl, workerContactMessage } from "@/lib/workers/whatsapp";

type Props = {
  worker: FeedWorker;
  user: MeUser;
};

export function WorkerCardActions({ worker, user }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRecruit = isRecruiterView(user) || user.can_hire;
  const waDigits = worker.contactWaDigits?.replace(/\D/g, "") ?? "";
  const canWhatsApp = waDigits.length >= 10;

  if (!canRecruit) {
    return (
      <p className="mt-auto pt-3 text-xs text-muted">Browse worker profiles available in your city.</p>
    );
  }

  function handleWhatsApp() {
    if (!canWhatsApp) {
      setError("WhatsApp not available for this profile.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const msg = workerContactMessage(worker.role, worker.city);
      window.open(buildWhatsAppUrl(waDigits, msg), "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-auto flex flex-col gap-2 pt-3">
      <button
        type="button"
        onClick={handleWhatsApp}
        disabled={!canWhatsApp || loading}
        className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-[#25D366] bg-[#25D366]/10 text-sm font-semibold text-[#128C7E] transition hover:bg-[#25D366]/20 disabled:opacity-50"
      >
        {loading ? "…" : "Contact on WhatsApp"}
      </button>
      {error ? (
        <p className="text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
