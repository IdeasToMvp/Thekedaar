"use client";

import type { ApplicationStatus } from "@/lib/jobs/types";

export type ApplicationFilterTab = "all" | ApplicationStatus;

const TABS: { id: ApplicationFilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

type Props = {
  active: ApplicationFilterTab;
  counts: Record<ApplicationFilterTab, number>;
  onChange: (tab: ApplicationFilterTab) => void;
};

export function ApplicationStatusTabs({ active, counts, onChange }: Props) {
  const tabClass = (tab: ApplicationFilterTab) =>
    active === tab
      ? "border-brand bg-brand/10 font-semibold text-brand-dark"
      : "border-border bg-surface text-muted hover:bg-slate-50 hover:text-foreground";

  return (
    <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Application status">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`min-h-10 rounded-xl border px-4 text-sm transition ${tabClass(tab.id)}`}
        >
          {tab.label}
          <span className="ml-1.5 tabular-nums opacity-80">({counts[tab.id]})</span>
        </button>
      ))}
    </div>
  );
}

export function applicationStatusCounts(
  applications: { status: ApplicationStatus }[],
): Record<ApplicationFilterTab, number> {
  return {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };
}

export function filterApplicationsByTab<T extends { status: ApplicationStatus }>(
  applications: T[],
  tab: ApplicationFilterTab,
): T[] {
  if (tab === "all") return applications;
  return applications.filter((a) => a.status === tab);
}
