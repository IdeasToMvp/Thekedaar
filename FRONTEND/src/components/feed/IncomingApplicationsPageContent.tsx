"use client";

import { useCallback, useEffect, useState } from "react";
import type { IncomingApplicationsResponse, JobApplication } from "@/lib/jobs/applications";
import { isEmployerAccount } from "@/lib/auth/accountRole";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { workerOrJobLocation } from "@/lib/location/publicLocation";
import type { ApplicationStatus } from "@/lib/jobs/types";
import { useFeedUser } from "./FeedUserProvider";
import { AppNavbar } from "./AppNavbar";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { ContactDetailsCard } from "./ContactDetailsCard";

export function IncomingApplicationsPageContent() {
  const { user, userLoading, cityId, setCityId } = useFeedUser();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

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

  const showNavbar = user || userLoading;
  const pending = applications.filter((a) => a.status === "pending");
  const rest = applications.filter((a) => a.status !== "pending");

  function renderCard(app: JobApplication) {
    const job = app.job;
    const worker = app.worker;
    const location = workerOrJobLocation({
      publicLocation: job.publicLocation,
      city: job.city,
      sector: job.sector,
    });
    const acting = actingId === app.id;

    return (
      <li key={app.id} className="flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-muted">{job.category}</p>
            <h2 className="font-serif text-lg font-bold text-foreground">{job.title}</h2>
            {location ? <p className="mt-0.5 text-xs text-muted">{location}</p> : null}
          </div>
          <ApplicationStatusBadge status={app.status} />
        </div>
        <p className="mt-2 text-sm font-bold text-brand">{formatSalary(job.salaryPerMonth)}</p>
        <p className="mt-1 text-[11px] text-muted">Applied {formatRelativeTime(app.appliedAt)}</p>

        {worker && app.status === "approved" && worker.phone ? (
          <ContactDetailsCard
            title="Worker contact"
            name={worker.name}
            phone={worker.phone}
            city={worker.city}
            sector={worker.sector}
            fullAddress={worker.fullAddress}
          />
        ) : worker ? (
          <div className="mt-3 rounded-xl border border-border bg-slate-50 px-3 py-2.5 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Applicant</p>
            <p className="mt-1 font-medium text-foreground">{worker.name}</p>
            <p className="text-xs text-muted">
              {worker.skills.join(", ") || "—"}
              {worker.experienceYears != null ? ` · ${worker.experienceYears} yrs exp` : ""}
            </p>
            <p className="mt-1 text-xs text-muted">Phone and address unlock after you approve</p>
          </div>
        ) : null}

        {app.status === "pending" ? (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={acting}
              onClick={() => void setStatus(app.id, "rejected")}
              className="min-h-9 flex-1 rounded-full border border-border text-sm font-semibold text-foreground disabled:opacity-50"
            >
              Decline
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => void setStatus(app.id, "approved")}
              className="min-h-9 flex-1 rounded-full bg-brand-dark text-sm font-semibold text-white disabled:opacity-50"
            >
              {acting ? "…" : "Approve"}
            </button>
          </div>
        ) : null}
      </li>
    );
  }

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
              No applications yet. New applies also notify you on WhatsApp.
            </p>
          ) : (
            <div className="mt-6 space-y-8">
              {pending.length > 0 ? (
                <section>
                  <h2 className="text-sm font-semibold text-foreground">Pending review ({pending.length})</h2>
                  <ul className="mt-3 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {pending.map(renderCard)}
                  </ul>
                </section>
              ) : null}
              {rest.length > 0 ? (
                <section>
                  <h2 className="text-sm font-semibold text-muted">Earlier</h2>
                  <ul className="mt-3 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map(renderCard)}
                  </ul>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
