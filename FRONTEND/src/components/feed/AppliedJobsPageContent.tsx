"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { JobApplication, WorkerApplicationsResponse } from "@/lib/jobs/applications";
import { isWorkerAccount } from "@/lib/auth/accountRole";
import type { ApplicationStatus } from "@/lib/jobs/types";
import { useFeedUser } from "./FeedUserProvider";
import { AppNavbar } from "./AppNavbar";
import { JobListingViewModal } from "./JobListingViewModal";
import { ApplicationListingCard } from "./ApplicationListingCard";
import {
  ApplicationStatusTabs,
  applicationStatusCounts,
  filterApplicationsByTab,
  type ApplicationFilterTab,
} from "./ApplicationStatusTabs";

export function AppliedJobsPageContent() {
  const { user, userLoading, cityId, setCityId } = useFeedUser();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewJobId, setViewJobId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<ApplicationFilterTab>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/applications/mine");
      const data = (await resp.json()) as WorkerApplicationsResponse;
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
    if (!user || !isWorkerAccount(user)) {
      setApplications([]);
      setLoading(false);
      return;
    }
    void load();
  }, [user, load]);

  const viewApp = applications.find((a) => a.job.id === viewJobId);
  const showNavbar = user || userLoading;

  const handleApplicationUpdated = (jobId: string, status: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((a) => (a.jobId === jobId ? { ...a, status, job: { ...a.job, applicationStatus: status } } : a)),
    );
  };

  const counts = useMemo(() => applicationStatusCounts(applications), [applications]);
  const filtered = useMemo(
    () => filterApplicationsByTab(applications, statusTab),
    [applications, statusTab],
  );

  const emptyMessages: Record<ApplicationFilterTab, string> = {
    all: "No applications yet.",
    pending: "No pending applications.",
    approved: "No approved applications yet. Employer contact shows here after approval.",
    rejected: "No applications marked as not selected.",
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
            <h1 className="font-serif text-2xl font-bold text-foreground">Applied</h1>
            <p className="mt-1 text-sm text-muted">
              Jobs you applied to. Employer contact appears here after approval.
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
              No applications yet.{" "}
              <Link href="/feed" className="font-semibold text-brand hover:underline">
                Browse jobs
              </Link>
            </p>
          ) : filtered.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-4 py-12 text-center text-sm text-muted">
              {emptyMessages[statusTab]}{" "}
              {statusTab === "all" ? (
                <Link href="/feed" className="font-semibold text-brand hover:underline">
                  Browse jobs
                </Link>
              ) : null}
            </p>
          ) : (
            <ul className="mt-6 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((app) => (
                <li key={app.id} className="flex">
                  <ApplicationListingCard
                    app={app}
                    variant="worker"
                    onViewListing={() => setViewJobId(app.job.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {user && viewApp ? (
        <JobListingViewModal
          open={Boolean(viewJobId)}
          job={{ ...viewApp.job, applicationStatus: viewApp.status }}
          user={user}
          onClose={() => setViewJobId(null)}
          onApplicationUpdated={handleApplicationUpdated}
        />
      ) : null}
    </div>
  );
}
