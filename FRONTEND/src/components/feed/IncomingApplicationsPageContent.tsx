"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { IncomingApplicationsResponse, JobApplication } from "@/lib/jobs/applications";
import { isEmployerAccount } from "@/lib/auth/accountRole";
import { workerProfileFromApplication } from "@/lib/applications/workerProfileFromApplication";
import type { ApplicationStatus } from "@/lib/jobs/types";
import type { FeedWorker, HiredWorker } from "@/lib/workers/types";
import { useFeedUser } from "./FeedUserProvider";
import { AppNavbar } from "./AppNavbar";
import { ApplicationListingCard } from "./ApplicationListingCard";
import { WorkerProfileModal } from "./WorkerProfileModal";
import {
  ApplicationStatusTabs,
  applicationStatusCounts,
  filterApplicationsByTab,
  type ApplicationFilterTab,
} from "./ApplicationStatusTabs";

export function IncomingApplicationsPageContent() {
  const { user, userLoading, cityId, setCityId } = useFeedUser();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<ApplicationFilterTab>("all");
  const [profileWorker, setProfileWorker] = useState<FeedWorker | HiredWorker | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/applications/incoming");
      const data = (await resp.json()) as IncomingApplicationsResponse;
      if (!resp.ok) throw new Error(data.error || "Could not load applications");
      setApplications(data.applications ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load applications");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !isEmployerAccount(user)) {
      setApplications([]);
      setLoading(false);
      return;
    }
    void load();
  }, [user, load]);

  async function setStatus(applicationId: string, status: "approved" | "rejected") {
    setActingId(applicationId);
    setError(null);
    try {
      const resp = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await resp.json()) as { error?: string; application?: JobApplication };
      if (!resp.ok) throw new Error(data.error || "Could not update application");
      if (data.application) {
        setApplications((prev) => prev.map((a) => (a.id === applicationId ? data.application! : a)));
      } else {
        setApplications((prev) =>
          prev.map((a) => (a.id === applicationId ? { ...a, status: status as ApplicationStatus } : a)),
        );
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not update");
    } finally {
      setActingId(null);
    }
  }

  function openProfile(app: JobApplication) {
    if (!app.worker) return;
    const includeContact = app.status === "approved" && Boolean(app.worker.phone);
    setProfileWorker(workerProfileFromApplication(app.worker, { includeContact }));
  }

  const showNavbar = user || userLoading;
  const counts = useMemo(() => applicationStatusCounts(applications), [applications]);
  const filtered = useMemo(
    () => filterApplicationsByTab(applications, statusTab),
    [applications, statusTab],
  );

  const emptyMessages: Record<ApplicationFilterTab, string> = {
    all: "No applications yet. New applies also notify you on WhatsApp.",
    pending: "No pending applications to review.",
    approved: "No approved applications yet.",
    rejected: "No declined applications.",
  };

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
            <h1 className="font-serif text-2xl font-bold text-foreground">Applications</h1>
            <p className="mt-1 text-sm text-muted">
              Workers who applied to your listings. Approve to share contact on the site and WhatsApp.
            </p>
          </header>

          {!loading && applications.length > 0 ? (
            <ApplicationStatusTabs active={statusTab} counts={counts} onChange={setStatusTab} />
          ) : null}

          {error ? (
            <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <ul className="mt-6 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <li key={i} className="h-48 animate-pulse rounded-2xl bg-slate-200/60" />
              ))}
            </ul>
          ) : applications.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-4 py-12 text-center text-sm text-muted">
              No applications yet. New applies also notify you on WhatsApp.
            </p>
          ) : filtered.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-4 py-12 text-center text-sm text-muted">
              {emptyMessages[statusTab]}
            </p>
          ) : (
            <ul className="mt-6 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((app) => (
                <li key={app.id} className="flex">
                  <ApplicationListingCard
                    app={app}
                    variant="employer"
                    acting={actingId === app.id}
                    onDecline={() => void setStatus(app.id, "rejected")}
                    onApprove={() => void setStatus(app.id, "approved")}
                    onViewProfile={
                      (app.status === "approved" || app.status === "rejected") && app.worker
                        ? () => openProfile(app)
                        : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <WorkerProfileModal
        open={Boolean(profileWorker)}
        mode={profileWorker && "phone" in profileWorker ? "hire" : "view"}
        worker={profileWorker}
        onClose={() => setProfileWorker(null)}
      />
    </div>
  );
}
