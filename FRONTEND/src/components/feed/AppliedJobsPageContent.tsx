"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { JobApplication, WorkerApplicationsResponse } from "@/lib/jobs/applications";
import { isWorkerAccount } from "@/lib/auth/accountRole";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { workerOrJobLocation } from "@/lib/location/publicLocation";
import { formatPhoneDisplay } from "@/lib/workers/formatPhone";
import type { ApplicationStatus } from "@/lib/jobs/types";
import { useFeedUser } from "./FeedUserProvider";
import { AppNavbar } from "./AppNavbar";
import { JobListingViewModal } from "./JobListingViewModal";

function statusBadge(status: ApplicationStatus) {
  if (status === "approved") {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
        Not selected
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
      Pending
    </span>
  );
}

export function AppliedJobsPageContent() {
  const { user, userLoading, cityId, setCityId } = useFeedUser();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewJobId, setViewJobId] = useState<string | null>(null);

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

          {error ? (
            <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <ul className="mt-6 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <li key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200/60" />
              ))}
            </ul>
          ) : applications.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-4 py-12 text-center text-sm text-muted">
              No applications yet.{" "}
              <Link href="/feed" className="font-semibold text-brand hover:underline">
                Browse jobs
              </Link>
            </p>
          ) : (
            <ul className="mt-6 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {applications.map((app) => {
                const job = app.job;
                const location = workerOrJobLocation({
                  publicLocation: job.publicLocation,
                  city: job.city,
                  sector: job.sector,
                });
                return (
                  <li
                    key={app.id}
                    className="flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-muted">{job.category}</p>
                        <h2 className="font-serif text-lg font-bold text-foreground">{job.title}</h2>
                        {location ? <p className="mt-0.5 text-xs text-muted">{location}</p> : null}
                      </div>
                      {statusBadge(app.status)}
                    </div>
                    <p className="mt-2 text-sm font-bold text-brand">{formatSalary(job.salaryPerMonth)}/mo</p>
                    <p className="mt-1 text-[11px] text-muted">Applied {formatRelativeTime(app.appliedAt)}</p>

                    {app.status === "approved" && app.employerContact ? (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                          Employer contact
                        </p>
                        <p className="mt-1 font-medium text-foreground">{app.employerContact.name}</p>
                        <a
                          href={`tel:${app.employerContact.phone.replace(/\D/g, "")}`}
                          className="mt-0.5 inline-block font-semibold text-brand hover:underline"
                        >
                          {formatPhoneDisplay(app.employerContact.phone)}
                        </a>
                      </div>
                    ) : app.status === "pending" ? (
                      <p className="mt-3 text-xs text-muted">
                        Waiting for employer approval. You will get WhatsApp when approved.
                      </p>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setViewJobId(job.id)}
                      className="mt-4 min-h-9 w-full rounded-full border border-border text-sm font-semibold text-foreground hover:bg-slate-50"
                    >
                      View listing
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      {user && viewApp ? (
        <JobListingViewModal
          open={Boolean(viewJobId)}
          job={viewApp.job}
          user={user}
          onClose={() => setViewJobId(null)}
          onApplicationUpdated={handleApplicationUpdated}
        />
      ) : null}
    </div>
  );
}
