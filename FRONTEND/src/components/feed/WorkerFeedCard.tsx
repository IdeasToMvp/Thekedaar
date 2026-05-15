"use client";

import type { FeedWorker } from "@/lib/workers/types";
import type { MeUser } from "@/lib/auth/types";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
function roleEmoji(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("cook")) return "👨‍🍳";
  if (r.includes("maid") || r.includes("house")) return "🧹";
  if (r.includes("shop")) return "🛒";
  return "💼";
}
import { WorkerCardActions } from "./WorkerCardActions";

type Props = {
  worker: FeedWorker;
  user: MeUser;
};

export function WorkerFeedCard({ worker, user }: Props) {
  const own = Boolean(worker.isOwnProfile);

  return (
    <article
      className={`flex h-full w-full flex-col rounded-2xl border bg-surface p-4 shadow-sm shadow-slate-900/5 sm:p-5 ${
        own ? "border-brand/40 ring-1 ring-brand/20" : "border-border"
      }`}
    >
      <div className="flex shrink-0 items-start justify-between gap-2">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/15 text-lg font-bold text-brand-dark"
          aria-hidden
        >
          {worker.avatarKey}
        </span>
        <div className="text-right">
          {own ? (
            <span className="mb-1 inline-block rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
              Your profile
            </span>
          ) : null}
          <p className="text-lg font-bold text-brand">
            {worker.expectedSalary > 0 ? formatSalary(worker.expectedSalary) : "—"}
          </p>
          <p className="text-[10px] text-muted">expected / mo</p>
        </div>
      </div>

      <h3 className="mt-3 line-clamp-1 text-base font-bold text-foreground">{worker.displayName}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
        <span aria-hidden>{roleEmoji(worker.role)}</span>
        {worker.role}
        <span className="text-border">·</span>
        {worker.city || "City not set"}
      </p>
      <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">
        {worker.experienceYears != null && worker.experienceYears > 0
          ? `${worker.experienceYears} yr experience · `
          : ""}
        {worker.availability}
      </p>
      <p className="mt-2 shrink-0 text-xs text-muted">Listed {formatRelativeTime(worker.listedAt)}</p>

      {own ? (
        <p className="mt-auto pt-3 text-xs text-muted">This is how employers see your profile on the feed.</p>
      ) : (
        <WorkerCardActions worker={worker} user={user} />
      )}
    </article>
  );
}
