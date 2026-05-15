"use client";

import { motion } from "framer-motion";
import type { FeedLimits } from "@/lib/planLimits";
import { PLAN_LIMITS } from "@/lib/planLimits";

type FeedUsageBannerProps = {
  limits: FeedLimits | null;
  currentMode: "worker" | "recruiter";
};

export function FeedUsageBanner({ limits, currentMode }: FeedUsageBannerProps) {
  if (!limits) return null;

  const { plan, feedContacts, jobListings } = limits;
  const contactPct = feedContacts.max > 0 ? Math.min(100, (feedContacts.used / feedContacts.max) * 100) : 0;

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-emerald-50/30 to-amber-50/20 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Your plan</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900 capitalize">
            {plan} · {currentMode === "recruiter" ? "Hiring view" : "Job seeker view"}
          </p>
        </div>
        {plan !== "pro" ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-amber-200/80">
            Upgrade for more
          </span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200/80">
            Pro active
          </span>
        )}
      </div>

      <UsageBar label="Job contacts" used={feedContacts.used} max={feedContacts.max} pct={contactPct} />
      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
        {currentMode === "recruiter"
          ? "Each listing you Hire or message on WhatsApp counts once (same job won’t count twice)."
          : "Each job you Apply to or open on WhatsApp counts once (same job won’t count twice)."}
        {" "}
        <span className="font-medium text-slate-800">
          Free: {PLAN_LIMITS.feedContacts.free} · Pro: {PLAN_LIMITS.feedContacts.pro}
        </span>
      </p>

      {jobListings ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 border-t border-slate-200/70 pt-4"
        >
          <UsageBar
            label={jobListings.scope === "month" ? "Your listings this month" : "Your listings (free plan)"}
            used={jobListings.used}
            max={jobListings.max}
            pct={jobListings.max > 0 ? Math.min(100, (jobListings.used / jobListings.max) * 100) : 0}
            tone="amber"
          />
          <p className="mt-1.5 text-[11px] text-slate-600">
            {jobListings.scope === "month"
              ? `Pro: up to ${PLAN_LIMITS.jobListingsPerMonth.pro} new posts per calendar month.`
              : `Free: up to ${PLAN_LIMITS.jobListingsLifetime.free} listings total — upgrade for monthly posts.`}
          </p>
        </motion.div>
      ) : null}
    </section>
  );
}

function UsageBar({
  label,
  used,
  max,
  pct,
  tone = "emerald",
}: {
  label: string;
  used: number;
  max: number;
  pct: number;
  tone?: "emerald" | "amber";
}) {
  const fill = tone === "amber" ? "bg-amber-500" : "bg-emerald-500";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-1 flex justify-between text-[11px] font-semibold text-slate-700">
        <span>{label}</span>
        <span>
          {used} / {max}
        </span>
      </div>
      <motion.div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className={`h-full rounded-full ${fill}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
