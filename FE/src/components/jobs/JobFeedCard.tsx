"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { JobListing } from "@/lib/jobs/types";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { posterListingLabel } from "@/lib/subscription";

export type JobFeedCardProps = {
  job: JobListing;
  viewerMode: "worker" | "recruiter";
  contacted: boolean;
  canContactMore: boolean;
  contactLoading: boolean;
  onPrimary: (job: JobListing) => void;
  onWhatsApp: (job: JobListing) => void;
};

function urgencyStyles(u: JobListing["urgency"]) {
  if (u === "high") return "bg-rose-50 text-rose-800 ring-rose-200/80";
  if (u === "medium") return "bg-amber-50 text-amber-900 ring-amber-200/80";
  return "bg-slate-50 text-slate-600 ring-slate-200/80";
}

function JobFeedCardInner({
  job,
  viewerMode,
  contacted,
  canContactMore,
  contactLoading,
  onPrimary,
  onWhatsApp,
}: JobFeedCardProps) {
  const listingLabel = posterListingLabel(job.posterSubscription);
  const isRecruiterView = viewerMode === "recruiter";
  const primaryLabel = isRecruiterView ? (contacted ? "Hired" : "Hire") : contacted ? "Applied" : "Apply";
  const disabled = contactLoading || (!canContactMore && !contacted);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_0_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-inner"
          aria-hidden
        >
          {job.employerAvatarKey}
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="truncate text-sm font-semibold text-slate-900">{job.employerDisplayName}</p>
            {listingLabel ? (
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200/80">
                {listingLabel}
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs text-slate-500">
            {formatRelativeTime(job.postedAt)} · {job.city}
          </p>
        </div>
        <span
          className={`hidden shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 sm:inline ${urgencyStyles(job.urgency)}`}
        >
          {job.urgency}
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="aspect-[4/3] w-full bg-gradient-to-br from-slate-100 via-emerald-50/40 to-amber-50/50"
      >
        <div className="flex h-full flex-col justify-end p-4 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800/90">{job.category}</p>
          <h2 className="mt-1 text-lg font-bold leading-snug text-slate-900 sm:text-xl">{job.title}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            ₹{job.salaryPerMonth.toLocaleString("en-IN")}{" "}
            <span className="font-normal text-slate-500">/ month</span>
          </p>
        </div>
      </motion.div>

      <div className="px-3 py-3 sm:px-4">
        <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{job.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <motion.button
            type="button"
            whileTap={disabled ? undefined : { scale: 0.98 }}
            disabled={disabled}
            onClick={() => onPrimary(job)}
            className={`inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold shadow-sm transition ${
              isRecruiterView
                ? "bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800"
                : "bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700"
            } disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none`}
          >
            {contactLoading ? "…" : primaryLabel}
          </motion.button>
          <motion.button
            type="button"
            whileTap={disabled ? undefined : { scale: 0.98 }}
            disabled={disabled}
            onClick={() => onWhatsApp(job)}
            className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-[#25D366] bg-white text-sm font-semibold text-[#128C7E] transition hover:bg-[#25D366]/10 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >
            WhatsApp
          </motion.button>
        </div>
        {!canContactMore && !contacted ? (
          <p className="mt-2 text-center text-[11px] font-medium text-amber-800">
            Contact limit reached — upgrade to Pro for more.
          </p>
        ) : null}
      </div>
    </article>
  );
}

export const JobFeedCard = memo(JobFeedCardInner);
