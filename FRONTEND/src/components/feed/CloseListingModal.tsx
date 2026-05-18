"use client";

import { useEffect, useState } from "react";
import type { FeedJob, JobHireCandidate } from "@/lib/jobs/types";
import { whatsAppHiUrl } from "@/lib/whatsappLinks";
import { CopyShareField } from "@/components/ui/CopyShareField";

type Props = {
  open: boolean;
  job: FeedJob;
  onClose: () => void;
  onSuccess: () => void;
};

type Step = "confirm" | "hired" | "pick_worker" | "off_platform";

function StepDots({ step }: { step: Step }) {
  const order: Step[] = ["confirm", "hired", "pick_worker", "off_platform"];
  const idx = order.indexOf(step);
  if (idx <= 0) return null;
  return (
    <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
      {order.slice(1, 4).map((s, i) => (
        <span
          key={s}
          className={`h-1.5 w-6 rounded-full transition-colors ${
            i + 1 <= idx ? "bg-brand" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

export function CloseListingModal({ open, job, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("confirm");
  const [candidates, setCandidates] = useState<JobHireCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [offPlatformName, setOffPlatformName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteUrl = whatsAppHiUrl(process.env.NEXT_PUBLIC_WHATSAPP_URL);

  useEffect(() => {
    if (!open) return;
    setStep("confirm");
    setCandidates([]);
    setSelectedWorkerId("");
    setOffPlatformName("");
    setError(null);
    setSubmitting(false);
  }, [open, job.id]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  async function loadCandidates() {
    setCandidatesLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/jobs/${job.id}/hire-candidates`);
      const data = (await resp.json()) as { candidates?: JobHireCandidate[]; error?: string };
      if (!resp.ok) throw new Error(data.error || "Could not load workers");
      setCandidates(data.candidates ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load workers");
    } finally {
      setCandidatesLoading(false);
    }
  }

  async function submitClose(body: {
    didHire: boolean;
    hiredWorkerId?: string;
    hireSource?: "platform_worker" | "off_platform" | "not_hired";
    hiredWorkerName?: string;
  }) {
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch(`/api/jobs/${job.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await resp.json()) as { error?: string };
      if (!resp.ok) throw new Error(data.error || "Could not close listing");
      onSuccess();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not close listing");
    } finally {
      setSubmitting(false);
    }
  }

  const showBack = step === "pick_worker" || step === "off_platform";

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-listing-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={() => !submitting && onClose()}
      />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl sm:max-w-lg sm:rounded-2xl">
        <div className="border-b border-border bg-gradient-to-b from-slate-50 to-surface px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Close listing</p>
          <h2 id="close-listing-title" className="mt-0.5 font-serif text-xl font-bold text-foreground">
            {job.title}
          </h2>
          <StepDots step={step} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {step === "confirm" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3.5">
                <p className="text-sm font-medium text-amber-950">What happens next</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-amber-900/90">
                  <li>Job is removed from active hiring on the feed</li>
                  <li>You cannot edit this listing — post a new job to hire again</li>
                  <li>Optional: tell us if you hired someone (helps improve matches)</li>
                </ul>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void submitClose({ didHire: false, hireSource: "not_hired" })}
                  className="min-h-11 rounded-full border border-border bg-white text-sm font-semibold text-foreground transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {submitting ? "Closing…" : "Close only"}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setStep("hired")}
                  className="min-h-11 rounded-full bg-brand-dark text-sm font-semibold text-white shadow-md shadow-brand/20 transition hover:bg-brand disabled:opacity-50"
                >
                  I hired someone
                </button>
              </div>
            </div>
          ) : null}

          {step === "hired" ? (
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                Did you fill this role? We use this to improve worker recommendations — it does not charge
                credits.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setStep("pick_worker");
                    void loadCandidates();
                  }}
                  className="min-h-11 rounded-full border-2 border-brand bg-brand/10 text-sm font-semibold text-brand-dark transition hover:bg-brand/15 disabled:opacity-50"
                >
                  Yes, hired
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void submitClose({ didHire: false, hireSource: "not_hired" })}
                  className="min-h-11 rounded-full border border-border text-sm font-semibold text-muted transition hover:bg-slate-50 disabled:opacity-50"
                >
                  No hire yet
                </button>
              </div>
            </div>
          ) : null}

          {step === "pick_worker" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Pick from applicants and workers who contacted you on this listing.
              </p>
              {candidatesLoading ? (
                <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-muted">Loading workers…</p>
              ) : candidates.length > 0 ? (
                <ul className="max-h-52 space-y-1.5 overflow-y-auto pr-0.5">
                  {candidates.map((c) => (
                    <li key={c.workerId}>
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                          selectedWorkerId === c.workerId
                            ? "border-brand bg-brand/5 ring-1 ring-brand/30"
                            : "border-border hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="hire-worker"
                          checked={selectedWorkerId === c.workerId}
                          onChange={() => setSelectedWorkerId(c.workerId)}
                          className="accent-brand"
                        />
                        <span className="min-w-0 flex-1 font-medium text-foreground">{c.displayName}</span>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
                          {c.source === "application" ? "Applied" : "Contacted"}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-border bg-slate-50/80 px-3 py-4 text-center text-sm text-muted">
                  No workers on Thekedaar linked to this listing yet.
                </p>
              )}
              <button
                type="button"
                onClick={() => setStep("off_platform")}
                className="w-full text-center text-sm font-medium text-brand hover:underline"
              >
                Hired someone else (not on Thekedaar) →
              </button>
              {selectedWorkerId ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    void submitClose({
                      didHire: true,
                      hireSource: "platform_worker",
                      hiredWorkerId: selectedWorkerId,
                    })
                  }
                  className="min-h-11 w-full rounded-full bg-brand-dark text-sm font-semibold text-white disabled:opacity-50"
                >
                  {submitting ? "Closing…" : "Close & save hire"}
                </button>
              ) : null}
            </div>
          ) : null}

          {step === "off_platform" ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="off-platform-name" className="text-xs font-medium text-muted">
                  Worker name (for your records)
                </label>
                <input
                  id="off-platform-name"
                  type="text"
                  value={offPlatformName}
                  onChange={(e) => setOffPlatformName(e.target.value)}
                  placeholder="e.g. Ramesh"
                  className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-teal-50/50 px-4 py-3.5">
                <p className="text-sm font-semibold text-emerald-950">Invite them to Thekedaar</p>
                <p className="mt-1 text-xs leading-relaxed text-emerald-900/80">
                  Copy and share this link on WhatsApp or SMS so they can register as a worker.
                </p>
                {inviteUrl ? (
                  <CopyShareField
                    className="mt-3"
                    label="Registration link"
                    value={inviteUrl}
                    hint="Paste in WhatsApp — they tap to say Hi and join as a worker."
                  />
                ) : (
                  <p className="mt-2 text-xs text-muted">WhatsApp link is not configured for this environment.</p>
                )}
              </div>
              <button
                type="button"
                disabled={submitting || !offPlatformName.trim()}
                onClick={() =>
                  void submitClose({
                    didHire: true,
                    hireSource: "off_platform",
                    hiredWorkerName: offPlatformName.trim(),
                  })
                }
                className="min-h-11 w-full rounded-full bg-brand-dark text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? "Closing…" : "Close listing"}
              </button>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex gap-2 border-t border-border bg-slate-50/50 px-5 py-4">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="min-h-10 flex-1 rounded-full border border-border bg-white text-sm font-semibold"
          >
            Cancel
          </button>
          {showBack ? (
            <button
              type="button"
              disabled={submitting}
              onClick={() => setStep(step === "off_platform" ? "pick_worker" : "hired")}
              className="min-h-10 flex-1 rounded-full border border-border bg-white text-sm font-semibold"
            >
              Back
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
