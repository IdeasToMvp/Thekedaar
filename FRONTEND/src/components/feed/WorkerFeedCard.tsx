"use client";

import type { FeedWorker, HiredWorker, WorkerHireLimits } from "@/lib/workers/types";
import type { MeUser } from "@/lib/auth/types";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { workerOrJobLocation } from "@/lib/location/publicLocation";
import { WorkerCardActions } from "./WorkerCardActions";
import { WorkerListingMeta } from "./WorkerListingMeta";

function roleEmoji(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("cook")) return "👨‍🍳";
  if (r.includes("maid") || r.includes("house")) return "🧹";
  if (r.includes("shop")) return "🛒";
  return "💼";
}

function categoryGradient(skills: string[]): string {
  const primary = skills[0]?.toLowerCase() ?? "";
  if (primary.includes("cook")) return "from-amber-50 to-orange-100";
  if (primary.includes("maid") || primary.includes("house")) return "from-sky-50 to-blue-100";
  if (primary.includes("shop")) return "from-emerald-50 to-teal-100";
  return "from-slate-50 to-slate-100";
}

type Props = {
  worker: FeedWorker;
  user: MeUser;
};

export function WorkerFeedCard({ worker, user, hired, contactsRemaining, onHired }: Props) {
  const own = Boolean(worker.isOwnProfile);
  const skills = worker.skills?.length ? worker.skills : worker.role ? [worker.role] : [];
  const location = workerOrJobLocation({
    publicLocation: worker.publicLocation,
    city: worker.city,
    sector: worker.sector,
  });

  return (
    <article
      className={`flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm shadow-slate-900/5 ${
        own ? "border-brand/40 ring-1 ring-brand/20" : "border-border"
      }`}
    >
      <div className={`relative px-4 pb-3 pt-4 sm:px-5 bg-gradient-to-br ${categoryGradient(skills)}`}>
        <div className="flex items-start gap-3 pr-24">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white text-lg font-bold text-brand-dark shadow-sm"
            aria-hidden
          >
            {worker.avatarKey}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="line-clamp-1 text-base font-bold text-foreground">{worker.displayName}</h3>
              {own ? (
                <span className="shrink-0 rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
                  You
                </span>
              ) : null}
            </div>
            {location && location !== "Location not set" ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted">{location}</p>
            ) : null}
            {skills.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1">
                {skills.map((skill) => (
                  <li
                    key={skill}
                    className="inline-flex items-center gap-0.5 rounded-full border border-white/60 bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-sm"
                  >
                    <span aria-hidden>{roleEmoji(skill)}</span>
                    {skill}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
        <div className="absolute right-4 top-4 sm:right-5">
          <div className="rounded-xl bg-white/95 px-2.5 py-1.5 text-right shadow-sm ring-1 ring-black/5">
            <p className="text-base font-bold leading-none text-brand">
              {worker.expectedSalary > 0 ? formatSalary(worker.expectedSalary) : "—"}
            </p>
            <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-muted">expected</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3 sm:px-5">
        <WorkerListingMeta worker={worker} />

        <p className="mt-3 text-[11px] text-muted">Listed {formatRelativeTime(worker.listedAt)}</p>

        {own ? (
          <p className="mt-auto border-t border-border pt-3 text-[11px] leading-relaxed text-muted">
            Employers see city & sector only — phone and full address stay hidden.
          </p>
        ) : (
          <WorkerCardActions
            worker={worker}
            user={user}
            hired={hired}
            contactsRemaining={contactsRemaining}
            onHired={onHired}
          />
        )}
      </div>
    </article>
  );
}
