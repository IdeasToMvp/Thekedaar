"use client";

import type { FeedWorker, HiredWorker, WorkerHireLimits } from "@/lib/workers/types";
import type { MeUser } from "@/lib/auth/types";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { workerOrJobLocation } from "@/lib/location/publicLocation";
import { WorkerCardActions } from "./WorkerCardActions";

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

function cardTeaser(worker: FeedWorker): string | null {
  const bits: string[] = [];
  if (worker.experienceYears != null && worker.experienceYears > 0) {
    bits.push(`${worker.experienceYears} yr${worker.experienceYears === 1 ? "" : "s"} exp`);
  }
  const avail = worker.availability?.trim();
  if (avail && avail !== "Not specified") bits.push(avail);
  return bits.length > 0 ? bits.join(" · ") : null;
}

type Props = {
  worker: FeedWorker;
  user: MeUser;
  hired: boolean;
  contactsRemaining: number;
  onHired: (worker: HiredWorker, limits?: WorkerHireLimits) => void;
};

export function WorkerFeedCard({ worker, user, hired, contactsRemaining, onHired }: Props) {
  const own = Boolean(worker.isOwnProfile);
  const skills = worker.skills?.length ? worker.skills : worker.role ? [worker.role] : [];
  const primarySkill = skills[0] ?? "";
  const location = workerOrJobLocation({
    publicLocation: worker.publicLocation,
    city: worker.city,
    sector: worker.sector,
  });
  const teaser = cardTeaser(worker);

  return (
    <article
      className={`flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm shadow-slate-900/5 ${
        own ? "border-brand/40 ring-1 ring-brand/20" : "border-border"
      }`}
    >
      <div className={`relative px-3 pb-2.5 pt-3 sm:px-4 bg-gradient-to-br ${categoryGradient(skills)}`}>
        <div className="flex items-start gap-2.5 pr-[5.5rem]">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white text-base font-bold text-brand-dark shadow-sm"
            aria-hidden
          >
            {worker.avatarKey}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="line-clamp-1 text-sm font-bold text-foreground">{worker.displayName}</h3>
              {own ? (
                <span className="shrink-0 rounded-full bg-brand/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand-dark">
                  You
                </span>
              ) : null}
            </div>
            {location && location !== "Location not set" ? (
              <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{location}</p>
            ) : null}
            {primarySkill ? (
              <p className="mt-1.5 inline-flex max-w-full items-center gap-0.5 truncate rounded-full border border-white/60 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm">
                <span aria-hidden>{roleEmoji(primarySkill)}</span>
                {primarySkill}
                {skills.length > 1 ? <span className="font-normal text-muted">+{skills.length - 1}</span> : null}
              </p>
            ) : null}
          </div>
        </div>
        <div className="absolute right-3 top-3 sm:right-4">
          <div className="rounded-lg bg-white/95 px-2 py-1 text-right shadow-sm ring-1 ring-black/5">
            <p className="text-sm font-bold leading-none text-brand">
              {worker.expectedSalary > 0 ? formatSalary(worker.expectedSalary) : "—"}
            </p>
            <p className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-muted">expected</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-2 sm:px-4">
        {teaser ? <p className="line-clamp-1 text-[11px] text-muted">{teaser}</p> : null}
        <p className={`text-[10px] text-muted ${teaser ? "mt-0.5" : ""}`}>Listed {formatRelativeTime(worker.listedAt)}</p>

        {own ? (
          <p className="mt-auto border-t border-border pt-2 text-[10px] leading-relaxed text-muted">
            Phone hidden on feed
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
