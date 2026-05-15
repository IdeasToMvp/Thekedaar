"use client";

import Link from "next/link";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { JobListing } from "@/lib/jobs/types";

export type ActivityItem = {
  jobId: string;
  action: "apply" | "whatsapp" | "hire";
  contactedAt: string;
  job: JobListing;
};

function actionLabel(action: ActivityItem["action"], mode: "worker" | "recruiter") {
  if (action === "whatsapp") return "WhatsApp";
  if (action === "hire") return "Hired";
  return mode === "recruiter" ? "Interested" : "Applied";
}

function ActivityList({ items, mode }: { items: ActivityItem[]; mode: "worker" | "recruiter" }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-600">
        Nothing here yet. Use the{" "}
        <Link href="/app" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
          feed
        </Link>{" "}
        to {mode === "recruiter" ? "shortlist candidates" : "apply to jobs"}.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.jobId}
          className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/90 bg-white px-3 py-3"
        >
          <JobSummary job={item.job} />
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
            {actionLabel(item.action, mode)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function JobSummary({ job }: { job: JobListing }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-slate-900">{job.title}</p>
      <p className="text-xs text-slate-500">
        {job.city} · ₹{job.salaryPerMonth.toLocaleString("en-IN")}/mo · {formatRelativeTime(job.postedAt)}
      </p>
    </div>
  );
}

export function ActivitySection({
  mode,
  applied,
  shortlisted,
  myListings,
}: {
  mode: "worker" | "recruiter";
  applied: ActivityItem[];
  shortlisted: ActivityItem[];
  myListings: JobListing[];
}) {
  if (mode === "worker") {
    return (
      <section className="border-t border-slate-200/80 pt-6">
        <h2 className="text-sm font-bold text-slate-900">Applied jobs</h2>
        <p className="mt-1 text-xs text-slate-500">Jobs you applied to or opened on WhatsApp from the feed.</p>
        <div className="mt-4">
          <ActivityList items={applied} mode="worker" />
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="border-t border-slate-200/80 pt-6">
        <h2 className="text-sm font-bold text-slate-900">Shortlisted candidates</h2>
        <p className="mt-1 text-xs text-slate-500">People you marked Hire or contacted on WhatsApp from the feed.</p>
        <div className="mt-4">
          <ActivityList items={shortlisted} mode="recruiter" />
        </div>
      </section>

      <section className="border-t border-slate-200/80 pt-6">
        <h2 className="text-sm font-bold text-slate-900">Your job listings</h2>
        <p className="mt-1 text-xs text-slate-500">Posts you have published as a hirer.</p>
        {myListings.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-600">
            No listings yet. Post jobs via WhatsApp onboarding.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {myListings.map((job) => (
              <li key={job.id} className="rounded-xl border border-slate-200/90 bg-white px-3 py-3">
                <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                <p className="text-xs text-slate-500">
                  {job.city} · {job.category} · {formatRelativeTime(job.postedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
