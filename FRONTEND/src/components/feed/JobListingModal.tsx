"use client";

import { useEffect, useState } from "react";
import type { FeedJob } from "@/lib/jobs/types";
import { ACTIVE_MARKET, cityToApiParam, getLaunchRole } from "@/lib/launch";
import { skillLabelToRoleId } from "@/lib/launch/skillIds";
import { LocalitySelect } from "./LocalitySelect";

export type JobListingFormValues = {
  roleId: string;
  sector: string;
  salary: string;
  timing: string;
  accommodation: "yes" | "no";
  minAge: string;
  maxAge: string;
  preferredGender: "any" | "male" | "female";
  aadhaarRequired: boolean;
  urgency: string;
  description: string;
};

type Props = {
  open: boolean;
  cityId: string;
  job?: FeedJob | null;
  onClose: () => void;
  onSuccess: () => void;
};

const URGENCY_OPTIONS = [
  { value: "Immediate", label: "Immediate" },
  { value: "1 week", label: "Within 1 week" },
  { value: "Flexible", label: "Flexible" },
] as const;

function urgencyFromJob(job: FeedJob): string {
  const raw = job.urgencyRaw?.trim();
  if (raw) return raw;
  if (job.urgency === "high") return "Immediate";
  return "Flexible";
}

function formFromJob(job: FeedJob): JobListingFormValues {
  const roleId = skillLabelToRoleId(job.category) || ACTIVE_MARKET.roles[0]?.id || "";
  return {
    roleId,
    sector: job.sector?.trim() || "",
    salary: job.salaryPerMonth > 0 ? String(job.salaryPerMonth) : "",
    timing: job.timing?.trim() || "",
    accommodation: job.accommodation ? "yes" : "no",
    minAge: job.minAge != null ? String(job.minAge) : "",
    maxAge: job.maxAge != null ? String(job.maxAge) : "",
    preferredGender:
      job.preferredGender === "male" || job.preferredGender === "female" ? job.preferredGender : "any",
    aadhaarRequired: job.requiredDocuments?.includes("aadhaar") ?? false,
    urgency: urgencyFromJob(job),
    description: job.description?.trim() || "",
  };
}

const emptyForm = (): JobListingFormValues => ({
  roleId: ACTIVE_MARKET.roles[0]?.id ?? "",
  sector: "",
  salary: "",
  timing: "",
  accommodation: "no",
  minAge: "",
  maxAge: "",
  preferredGender: "any",
  aadhaarRequired: true,
  urgency: "Flexible",
  description: "",
});

export function JobListingModal({ open, cityId, job, onClose, onSuccess }: Props) {
  const isEdit = Boolean(job);
  const [form, setForm] = useState<JobListingFormValues>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(job ? formFromJob(job) : emptyForm());
    setError(null);
    setSubmitting(false);
  }, [open, job]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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

    const sector = form.sector.trim();
    if (!sector) {
      setError("Select area / sector in Gurugram.");
      return;
    }

    const timing = form.timing.trim();
    if (!timing) {
      setError("Enter working hours or timing.");
      return;
    }

    const minAge = form.minAge.trim() ? Number(form.minAge) : null;
    const maxAge = form.maxAge.trim() ? Number(form.maxAge) : null;
    if (minAge != null && (!Number.isInteger(minAge) || minAge < 16 || minAge > 80)) {
      setError("Minimum age must be between 16 and 80.");
      return;
    }
    if (maxAge != null && (!Number.isInteger(maxAge) || maxAge < 16 || maxAge > 80)) {
      setError("Maximum age must be between 16 and 80.");
      return;
    }
    if (minAge != null && maxAge != null && minAge > maxAge) {
      setError("Minimum age cannot be greater than maximum age.");
      return;
    }

    const payload = {
      title: role.label,
      category: role.apiCategory,
      city: cityToApiParam(cityId) ?? ACTIVE_MARKET.displayName,
      sector,
      salary: Math.round(salaryNum),
      timing,
      accommodation: form.accommodation === "yes",
      minAge,
      maxAge,
      preferredGender: form.preferredGender,
      requiredDocuments: form.aadhaarRequired ? (["aadhaar"] as const) : [],
      urgency: form.urgency,
      description: form.description.trim() || null,
    };

    setSubmitting(true);
    try {
      const resp = await fetch(isEdit && job ? `/api/jobs/${job.id}` : "/api/jobs", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await resp.json()) as { error?: string };
      if (!resp.ok) {
        throw new Error(data.error || (isEdit ? "Could not save listing" : "Could not post job"));
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="job-listing-title">
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
          <h2 id="job-listing-title" className="font-serif text-xl font-bold text-foreground">
            {isEdit ? "Edit listing" : "Post a job"}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {isEdit ? "Update details shown on the job feed" : `Listing in ${ACTIVE_MARKET.displayName}`}
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

          <LocalitySelect
            className="mt-4"
            value={form.sector}
            onChange={(sector) => setForm((f) => ({ ...f, sector }))}
            required
            hint={`City is ${cityToApiParam(cityId) ?? ACTIVE_MARKET.displayName}. Street address is collected on WhatsApp only — not shown on the feed.`}
          />

          <label className="mt-4 block text-sm font-medium text-foreground">
            Monthly salary (₹)
            <input
              type="text"
              inputMode="numeric"
              required
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
              value={form.timing}
              onChange={(e) => setForm((f) => ({ ...f, timing: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
          </label>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-foreground">
              Min age
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 20"
                value={form.minAge}
                onChange={(e) => setForm((f) => ({ ...f, minAge: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Max age
              <input
                type="text"
                inputMode="numeric"
                placeholder="Optional"
                value={form.maxAge}
                onChange={(e) => setForm((f) => ({ ...f, maxAge: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-medium text-foreground">
            Preferred gender
            <select
              value={form.preferredGender}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  preferredGender: e.target.value as JobListingFormValues["preferredGender"],
                }))
              }
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            >
              <option value="any">Any</option>
              <option value="male">Male only</option>
              <option value="female">Female only</option>
            </select>
          </label>

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={form.aadhaarRequired}
              onChange={(e) => setForm((f) => ({ ...f, aadhaarRequired: e.target.checked }))}
              className="h-4 w-4 accent-brand"
            />
            Aadhaar card required
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
            className="min-h-11 flex-1 rounded-full border border-border text-sm font-semibold text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-11 flex-1 rounded-full bg-brand-dark text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Post job"}
          </button>
        </div>
      </form>
    </div>
  );
}
