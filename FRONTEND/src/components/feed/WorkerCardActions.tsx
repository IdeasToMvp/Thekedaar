"use client";

import { useState } from "react";
import type { FeedWorker, HiredWorker, WorkerHireLimits } from "@/lib/workers/types";
import type { MeUser } from "@/lib/auth/types";
import { isEmployerAccount } from "@/lib/auth/accountRole";
import { WorkerProfileModal } from "./WorkerProfileModal";

type Props = {
  worker: FeedWorker;
  user: MeUser;
  hired: boolean;
  contactsRemaining: number;
  onHired: (worker: HiredWorker, limits?: WorkerHireLimits) => void;
};

export function WorkerCardActions({ worker, user, hired, contactsRemaining, onHired }: Props) {
  const employerView = isEmployerAccount(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"view" | "hire" | null>(null);
  const [hiredWorker, setHiredWorker] = useState<HiredWorker | null>(null);

  if (!employerView) {
    return <p className="mt-auto pt-3 text-xs text-muted">Worker profiles are for employer accounts.</p>;
  }

  async function handleHire() {
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch(`/api/workers/${worker.id}/hire`, { method: "POST" });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Could not unlock contact");
      }
      const unlocked = data.worker as HiredWorker | undefined;
      if (!unlocked) throw new Error("Worker details missing");
      setHiredWorker(unlocked);
      setModal("hire");
      onHired(unlocked, data.limits as WorkerHireLimits | undefined);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function openHire() {
    if (hiredWorker) {
      setModal("hire");
      return;
    }
    void handleHire();
  }

  const hireDisabled = !hired && contactsRemaining <= 0;

  return (
    <>
      <div className="mt-auto space-y-2 border-t border-border pt-3">
        {error ? (
          <p className="text-xs text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModal("view")}
            className="min-h-10 flex-1 rounded-full border border-border bg-background text-sm font-semibold text-foreground transition hover:bg-slate-50"
          >
            View profile
          </button>
          <button
            type="button"
            onClick={openHire}
            disabled={loading || hireDisabled}
            className="min-h-10 flex-1 rounded-full bg-brand-dark text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "…" : hired ? "Contact" : "Hire"}
            {hired ? " ✓" : ""}
          </button>
        </div>
        {hireDisabled ? (
          <p className="text-[11px] text-muted">Worker contact limit reached for your plan.</p>
        ) : (
          <p className="text-[11px] text-muted">Hire unlocks phone & WhatsApp · full address never shown</p>
        )}
      </div>

      <WorkerProfileModal
        open={modal === "view"}
        mode="view"
        worker={worker}
        onClose={() => setModal(null)}
      />
      <WorkerProfileModal
        open={modal === "hire"}
        mode="hire"
        worker={hiredWorker}
        onClose={() => setModal(null)}
      />
    </>
  );
}
