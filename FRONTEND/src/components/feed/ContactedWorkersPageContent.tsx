"use client";

import { useCallback, useEffect, useState } from "react";
import type { ContactedWorkersResponse, HiredWorker, WorkerHireLimits } from "@/lib/workers/types";
import { isEmployerAccount } from "@/lib/auth/accountRole";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { workerOrJobLocation } from "@/lib/location/publicLocation";
import { useFeedUser } from "./FeedUserProvider";
import { AppNavbar } from "./AppNavbar";
import { WorkerProfileModal } from "./WorkerProfileModal";

export function ContactedWorkersPageContent() {
  const { user, userLoading, cityId, setCityId } = useFeedUser();
  const [items, setItems] = useState<ContactedWorkersResponse["contacted"]>([]);
  const [limits, setLimits] = useState<WorkerHireLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<HiredWorker | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/workers/contacted");
      const data = (await resp.json()) as ContactedWorkersResponse;
      if (!resp.ok) {
        throw new Error(data.error || "Could not load contacted workers");
      }
      setItems(data.contacted ?? []);
      setLimits(data.limits ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load contacted workers");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !isEmployerAccount(user)) {
      setItems([]);
      setLoading(false);
      return;
    }
    void load();
  }, [user, load]);

  const showNavbar = user || userLoading;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {showNavbar && user ? (
        <AppNavbar user={user} cityId={cityId} onCityChange={setCityId} />
      ) : showNavbar ? (
        <header className="h-14 shrink-0 animate-pulse border-b border-border bg-surface" />
      ) : null}

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-4 py-6 pb-24 sm:px-6">
          <header>
            <h1 className="font-serif text-2xl font-bold text-foreground">Contacted workers</h1>
            <p className="mt-1 text-sm text-muted">
              Workers you hired from the feed — phone and WhatsApp unlocked here.
            </p>
            {limits ? (
              <p className="mt-2 text-xs text-muted">
                {limits.workerContacts.used} / {limits.workerContacts.max} worker contacts used
              </p>
            ) : null}
          </header>

          {error ? (
            <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <ul className="mt-6 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <li key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </ul>
          ) : items.length === 0 ? (
            <p className="mt-10 text-center text-sm text-muted">
              No workers yet. Tap <span className="font-semibold text-foreground">Hire</span> on Find Workers to save
              someone here.
            </p>
          ) : (
            <ul className="mt-6 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(({ worker, hiredAt }) => {
                const skills = worker.skills?.length ? worker.skills : worker.role ? [worker.role] : [];
                const location = workerOrJobLocation({
                  publicLocation: worker.publicLocation,
                  city: worker.city,
                  sector: worker.sector,
                });
                return (
                  <li key={worker.id}>
                    <article className="flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-sm font-bold text-brand-dark">
                          {worker.avatarKey}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h2 className="font-semibold text-foreground">{worker.displayName}</h2>
                          {location ? <p className="text-xs text-muted">{location}</p> : null}
                          {skills[0] ? <p className="mt-1 text-xs font-medium text-foreground">{skills.join(", ")}</p> : null}
                        </div>
                        <p className="shrink-0 text-sm font-bold text-brand">
                          {worker.expectedSalary > 0 ? formatSalary(worker.expectedSalary) : "—"}
                        </p>
                      </div>
                      <p className="mt-3 text-[11px] text-muted">Hired {formatRelativeTime(hiredAt)}</p>
                      <button
                        type="button"
                        onClick={() => setSelected(worker)}
                        className="mt-4 min-h-10 w-full rounded-full bg-brand-dark text-sm font-semibold text-white"
                      >
                        View contact
                      </button>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <WorkerProfileModal open={Boolean(selected)} mode="hire" worker={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
