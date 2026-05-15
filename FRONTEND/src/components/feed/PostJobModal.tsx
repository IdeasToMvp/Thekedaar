"use client";

import { useEffect, useState } from "react";
import { ACTIVE_MARKET, cityToApiParam, getLaunchRole } from "@/lib/launch";

export type PostJobFormValues = {
  roleId: string;
  salary: string;
  timing: string;
  accommodation: "yes" | "no";
  urgency: string;
  description: string;
};

type Props = {
  open: boolean;
  cityId: string;
  onClose: () => void;
  onSuccess: () => void;
};

const URGENCY_OPTIONS = [
  { value: "Immediate", label: "Immediate" },
  { value: "1 week", label: "Within 1 week" },
  { value: "Flexible", label: "Flexible" },
] as const;

const initialForm = (): PostJobFormValues => ({
  roleId: ACTIVE_MARKET.roles[0]?.id ?? "",
  salary: "",
  timing: "",
  accommodation: "no",
  urgency: "Flexible",
  description: "",
});

export function PostJobModal({ open, cityId, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<PostJobFormValues>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm());
    setError(null);
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, submitting]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const role = getLaunchRole(form.roleId);
    if (!role) {
      setError("Please choose a role.");
      return;
    }

    const salaryNum = Number(form.salary.replace(/,/g, "").trim());
    if (!Number.isFinite(salaryNum) || salaryNum <= 0) {
      setError("Enter a valid monthly salary (numbers only).");
      return;
    }

    const timing = form.timing.trim();
    if (!timing) {
      setError("Enter working hours or timing.");
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: role.label,
          category: role.apiCategory,
          city: cityToApiParam(cityId) ?? ACTIVE_MARKET.displayName,
          salary: Math.round(salaryNum),
          timing,
          accommodation: form.accommodation === "yes",
          urgency: form.urgency,
          description: form.description.trim() || null,
        }),
      });
      const data = (await resp.json()) as { error?: string };
      if (!resp.ok) {
        throw new Error(data.error || "Could not post job");
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not post job");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="post-job-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close"
        onClick={() => !submitting && onClose()}
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface shadow-xl sm:rounded-2xl"
      >
        <div className="shrink-0 border-b border-border px-5 py-4">
          <h2 id="post-job-title" className="font-serif text-xl font-bold text-foreground">
            Post a job
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            Listing in {ACTIVE_MARKET.displayName} · visible on the job feed
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <label className="block text-sm font-medium text-foreground">
            Role needed
            <select
              required
              value={form.roleId}
              onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            >
              {ACTIVE_MARKET.roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 block text-sm font-medium text-foreground">
            Monthly salary (₹)
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="e.g. 18000"
              value={form.salary}
              onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-foreground">
            Timing
            <input
              type="text"
              required
              placeholder="e.g. 9am – 7pm"
              value={form.timing}
              onChange={(e) => setForm((f) => ({ ...f, timing: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
          </label>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-foreground">Accommodation provided?</legend>
            <div className="mt-2 flex gap-4">
              {(["no", "yes"] as const).map((v) => (
                <label key={v} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="accommodation"
                    checked={form.accommodation === v}
                    onChange={() => setForm((f) => ({ ...f, accommodation: v }))}
                    className="accent-brand"
                  />
                  {v === "yes" ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-4 block text-sm font-medium text-foreground">
            Urgency
            <select
              value={form.urgency}
              onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            >
              {URGENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 block text-sm font-medium text-foreground">
            Description <span className="font-normal text-muted">(optional)</span>
            <textarea
              rows={3}
              placeholder="Any extra details for workers…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
          </label>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-h-11 flex-1 rounded-full border border-border text-sm font-semibold text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-11 flex-1 rounded-full bg-brand-dark text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Posting…" : "Post job"}
          </button>
        </div>
      </form>
    </div>
  );
}
