"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MeResponse, MeUser } from "@/lib/auth/types";
import type { FeedJob, FeedLimits, FeedResponse } from "@/lib/jobs/types";
import {
  ACTIVE_MARKET,
  cityToApiParam,
  filterJobsBySalary,
  filterJobsToLaunchMarket,
  launchHighlights,
  pickFeaturedJob,
  roleToApiParam,
  type SalaryBandId,
} from "@/lib/launch";
import { isRecruiterView } from "@/lib/jobs/viewerRole";
import { AppNavbar } from "./AppNavbar";
import { FeedSidebar } from "./FeedSidebar";
import { FeedMobileFilters } from "./FeedMobileFilters";
import { FeaturedJobCard } from "./FeaturedJobCard";
import { FeedJobCard } from "./FeedJobCard";
import { NearbyHighlights } from "./NearbyHighlights";
import { PostJobFab } from "./PostJobFab";
import { PostJobModal } from "./PostJobModal";

const PAGE_SIZE = 24;

type SortOption = "newest" | "salary_high" | "salary_low";

export function FeedPageContent() {
  const [user, setUser] = useState<MeUser | null>(null);
  const [jobs, setJobs] = useState<FeedJob[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roleId, setRoleId] = useState("");
  const [cityId, setCityId] = useState(ACTIVE_MARKET.defaultCityId);
  const [salaryBand, setSalaryBand] = useState<SalaryBandId>("all");
  const [sort] = useState<SortOption>("newest");
  const [postJobOpen, setPostJobOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json() as Promise<MeResponse>)
      .then((data) => {
        if (cancelled || !data?.user) return;
        const u = { ...data.user };
        if (data.recruiter_profile) u.can_hire = true;
        setUser(u);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchFeed = useCallback(
    async (nextOffset: number, append: boolean) => {
      const params = new URLSearchParams({
        offset: String(nextOffset),
        limit: String(PAGE_SIZE),
        sort,
      });
      const apiCity = cityToApiParam(cityId);
      const apiCategory = roleToApiParam(roleId);
      if (apiCity) params.set("city", apiCity);
      if (apiCategory) params.set("category", apiCategory);

      const resp = await fetch(`/api/feed?${params}`);
      const data = (await resp.json()) as FeedResponse;

      if (!resp.ok) {
        throw new Error(data.error || "Could not load jobs");
      }

      const scoped = filterJobsToLaunchMarket(data.jobs, cityId, roleId);

      setTotal(scoped.length < data.jobs.length ? scoped.length : data.total);
      setHasMore(data.hasMore);
      setOffset(data.offset + data.jobs.length);
      setJobs((prev) => (append ? [...prev, ...scoped] : scoped));
    },
    [cityId, roleId, sort],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setOffset(0);

    fetchFeed(0, false)
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load jobs");
          setJobs([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchFeed]);

  const salaryFiltered = useMemo(() => filterJobsBySalary(jobs, salaryBand), [jobs, salaryBand]);

  const featured = useMemo(() => pickFeaturedJob(salaryFiltered), [salaryFiltered]);

  const gridJobs = useMemo(() => {
    if (!featured) return salaryFiltered;
    return salaryFiltered.filter((j) => j.id !== featured.id);
  }, [salaryFiltered, featured]);

  const highlights = useMemo(() => launchHighlights(salaryFiltered), [salaryFiltered]);

  function handleContactRecorded(_jobId: string, _limits?: FeedLimits) {}

  function clearFilters() {
    setRoleId("");
    setCityId(ACTIVE_MARKET.defaultCityId);
    setSalaryBand("all");
  }

  const hasActiveFilters = Boolean(roleId || salaryBand !== "all");

  async function loadMore() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchFeed(offset, true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load more");
    } finally {
      setLoadingMore(false);
    }
  }

  const { displayName } = ACTIVE_MARKET;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {user ? <AppNavbar user={user} cityId={cityId} onCityChange={setCityId} /> : null}

      <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1">
        <div className="hidden w-56 shrink-0 overflow-y-auto overscroll-contain border-r border-border xl:w-60 lg:block">
          <FeedSidebar
            roleId={roleId}
            salaryBand={salaryBand}
            onRoleChange={setRoleId}
            onSalaryBandChange={setSalaryBand}
            onClear={clearFilters}
          />
        </div>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border px-4 py-4 sm:px-6 lg:hidden">
            <FeedMobileFilters
              roleId={roleId}
              salaryBand={salaryBand}
              onRoleChange={setRoleId}
              onSalaryBandChange={setSalaryBand}
            />
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 text-sm font-medium text-brand underline-offset-2 hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 pb-24 sm:px-6">
            <header>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Jobs in {displayName}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {loading ? (
                  "Loading listings…"
                ) : (
                  <>
                    <span className="font-medium text-foreground">{total} </span>open roles · Maids, cooks &amp; shop
                    helpers
                  </>
                )}
              </p>
            </header>

            <NearbyHighlights items={highlights} />

            {error ? (
              <div
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
                role="alert"
              >
                <p className="font-medium">{error}</p>
                <p className="mt-2 text-red-800/80">Make sure the backend is running.</p>
              </div>
            ) : null}

            {user && featured && !loading && !error ? (
              <section className="mt-6" aria-label="Featured job">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Featured</p>
                <FeaturedJobCard job={featured} user={user} onContactRecorded={handleContactRecorded} />
              </section>
            ) : null}

            {loading ? (
              <ul className="mt-6 grid list-none grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i}>
                    <div className="h-full min-h-[19.5rem] animate-pulse rounded-2xl bg-slate-200/60 sm:min-h-[20.5rem]" />
                  </li>
                ))}
              </ul>
            ) : gridJobs.length === 0 && !error ? (
              <p className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-4 py-12 text-center text-sm text-muted">
                No jobs match these filters in {displayName}. Try another role or salary band.
              </p>
            ) : !user ? (
              <ul className="mt-6 grid list-none grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i}>
                    <div className="h-full min-h-[19.5rem] animate-pulse rounded-2xl bg-slate-200/60 sm:min-h-[20.5rem]" />
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <ul className="mt-6 grid list-none grid-cols-1 gap-4 sm:grid-cols-2 sm:items-stretch">
                  {gridJobs.map((job) => (
                    <li key={job.id} className="flex min-h-[19.5rem] min-w-0 sm:min-h-[20.5rem]">
                      <FeedJobCard job={job} user={user} onContactRecorded={handleContactRecorded} />
                    </li>
                  ))}
                </ul>
                {hasMore ? (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="min-h-11 rounded-full border border-border bg-surface px-8 text-sm font-semibold text-foreground transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      {loadingMore ? "Loading…" : "Load more jobs"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </main>
      </div>

      {user && isRecruiterView(user) ? (
        <>
          <PostJobFab onClick={() => setPostJobOpen(true)} />
          <PostJobModal
            open={postJobOpen}
            cityId={cityId}
            onClose={() => setPostJobOpen(false)}
            onSuccess={() => fetchFeed(0, false).catch(() => {})}
          />
        </>
      ) : null}
    </div>
  );
}
