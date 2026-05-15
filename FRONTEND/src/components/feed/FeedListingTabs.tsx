"use client";

export type FeedListingTab = "jobs" | "workers";

type Props = {
  active: FeedListingTab;
  onChange: (tab: FeedListingTab) => void;
};

export function FeedListingTabs({ active, onChange }: Props) {
  const tabClass = (tab: FeedListingTab) =>
    active === tab
      ? "border-brand bg-brand/10 font-semibold text-brand-dark"
      : "border-border bg-surface text-muted hover:bg-slate-50 hover:text-foreground";

  return (
    <div className="mt-4 flex gap-2" role="tablist" aria-label="Listing type">
      <button
        type="button"
        role="tab"
        aria-selected={active === "jobs"}
        onClick={() => onChange("jobs")}
        className={`min-h-10 flex-1 rounded-xl border px-4 text-sm transition sm:flex-none sm:px-6 ${tabClass("jobs")}`}
      >
        Jobs
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "workers"}
        onClick={() => onChange("workers")}
        className={`min-h-10 flex-1 rounded-xl border px-4 text-sm transition sm:flex-none sm:px-6 ${tabClass("workers")}`}
      >
        Workers
      </button>
    </div>
  );
}
