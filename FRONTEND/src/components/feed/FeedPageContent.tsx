"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeedJob, FeedLimits, FeedResponse } from "@/lib/jobs/types";
import type { ActivityResponse } from "@/lib/jobs/activity";
import { enrichFeedWithOwnListings } from "@/lib/jobs/enrichFeedWithOwnListings";
import type { FeedWorker, WorkersFeedResponse } from "@/lib/workers/types";
import { filterWorkersBySalary, filterWorkersToLaunchMarket } from "@/lib/workers/filterWorkers";
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
import { useFeedUser } from "./FeedUserProvider";
import { AppNavbar } from "./AppNavbar";
import { FeedSidebar } from "./FeedSidebar";
import { FeedMobileFilters } from "./FeedMobileFilters";
import { FeaturedJobCard } from "./FeaturedJobCard";
import { FeedJobCard } from "./FeedJobCard";
import { WorkerFeedCard } from "./WorkerFeedCard";
import { NearbyHighlights } from "./NearbyHighlights";
import { PostJobFab } from "./PostJobFab";
import { JobListingModal } from "./JobListingModal";
import { FeedListingTabs, type FeedListingTab } from "./FeedListingTabs";

const PAGE_SIZE = 24;

type SortOption = "newest" | "salary_high" | "salary_low";

export function FeedPageContent() {
  const { user, userLoading, cityId, setCityId } = useFeedUser();
  const [listingTab, setListingTab] = useState<FeedListingTab>("jobs");

  const [jobs, setJobs] = useState<FeedJob[]>([]);
  const [myListings, setMyListings] = useState<FeedJob[]>([]);
  const [workers, setWorkers] = useState<FeedWorker[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [workersTotal, setWorkersTotal] = useState(0);
  const [jobsOffset, setJobsOffset] = useState(0);
  const [workersOffset, setWorkersOffset] = useState(0);
  const [jobsHasMore, setJobsHasMore] = useState(false);
  const [workersHasMore, setWorkersHasMore] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [workersLoading, setWorkersLoading] = useState(true);
  const [jobsLoadingMore, setJobsLoadingMore] = useState(false);
  const [workersLoadingMore, setWorkersLoadingMore] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [workersError, setWorkersError] = useState<string | null>(null);

  const [roleId, setRoleId] = useState("");
  const [salaryBand, setSalaryBand] = useState<SalaryBandId>("all");
  const [sort] = useState<SortOption>("newest");
  const [postJobOpen, setPostJobOpen] = useState(false);

  useEffect(() => {
    if (!user?.can_hire) {
      setMyListings([]);
      return;
    }
    let cancelled = false;
    fetch("/api/auth/activity")
      .then((r) => r.json())
      .then((data: ActivityResponse) => {
        if (!cancelled) setMyListings(data.myListings ?? []);
      })
      .catch(() => {
        if (!cancelled) setMyListings([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.can_hire, user?.id]);

  const fetchJobsFeed = useCallback(
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
      if (!resp.ok) throw new Error(data.error || "Could not load jobs");

      const scoped = filterJobsToLaunchMarket(data.jobs, cityId, roleId);
      setJobsTotal(scoped.length < data.jobs.length ? scoped.length : data.total);
      setJobsHasMore(data.hasMore);
      setJobsOffset(data.offset + data.jobs.length);
      setJobs((prev) => (append ? [...prev, ...scoped] : scoped));
    },
    [cityId, roleId, sort],
  );

  const fetchWorkersFeed = useCallback(
    async (nextOffset: number, append: boolean) => {
      const params = new URLSearchParams({
        offset: String(nextOffset),
        limit: String(PAGE_SIZE),
        sort,
      });
      const apiCity = cityToApiParam(cityId);
      const apiRole = roleToApiParam(roleId);
      if (apiCity) params.set("city", apiCity);
      if (apiRole) params.set("role", apiRole);

      const resp = await fetch(`/api/workers/feed?${params}`);
      const data = (await resp.json()) as WorkersFeedResponse;
      if (!resp.ok) throw new Error(data.error || "Could not load workers");

      const scoped = filterWorkersToLaunchMarket(data.workers, cityId, roleId);
      setWorkersTotal(scoped.length < data.workers.length ? scoped.length : data.total);
      setWorkersHasMore(data.hasMore);
      setWorkersOffset(data.offset + data.workers.length);
      setWorkers((prev) => (append ? [...prev, ...scoped] : scoped));
    },
    [cityId, roleId, sort],
  );

  useEffect(() => {
    let cancelled = false;
    setJobsLoading(true);
    setJobsError(null);
    setJobsOffset(0);
    fetchJobsFeed(0, false)
      .catch((e: unknown) => {
        if (!cancelled) {
          setJobsError(e instanceof Error ? e.message : "Could not load jobs");
          setJobs([]);
        }
      })
      .finally(() => {
        if (!cancelled) setJobsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchJobsFeed]);

  useEffect(() => {
    let cancelled = false;
    setWorkersLoading(true);
    setWorkersError(null);
    setWorkersOffset(0);
    fetchWorkersFeed(0, false)
      .catch((e: unknown) => {
        if (!cancelled) {
          setWorkersError(e instanceof Error ? e.message : "Could not load workers");
          setWorkers([]);
        }
      })
      .finally(() => {
        if (!cancelled) setWorkersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchWorkersFeed]);

  const withOwnJobs = useMemo(
    () => (user?.can_hire ? enrichFeedWithOwnListings(jobs, myListings) : jobs),
    [jobs, myListings, user?.can_hire],
  );

  const salaryFilteredJobs = useMemo(() => {
    if (salaryBand === "all") return withOwnJobs;
    const passed = filterJobsBySalary(withOwnJobs, salaryBand);
    const ownRows = withOwnJobs.filter((j) => j.isOwnListing);
    return enrichFeedWithOwnListings(passed, ownRows);
  }, [withOwnJobs, salaryBand]);

  const salaryFilteredWorkers = useMemo(
    () => filterWorkersBySalary(workers, salaryBand),
    [workers, salaryBand],
  );

  const featured = useMemo(() => {
    const candidates = salaryFilteredJobs.filter((j) => !j.isOwnListing);
    return pickFeaturedJob(candidates.length > 0 ? candidates : salaryFilteredJobs);
  }, [salaryFilteredJobs]);

  const gridJobs = useMemo(() => {
    if (!featured) return salaryFilteredJobs;
    return salaryFilteredJobs.filter((j) => j.id !== featured.id);
  }, [salaryFilteredJobs, featured]);

  const highlights = useMemo(() => launchHighlights(salaryFilteredJobs), [salaryFilteredJobs]);

  const displayJobsTotal = useMemo(() => {
    if (!user?.can_hire) return jobsTotal;
    const ownOnly = salaryFilteredJobs.filter((j) => j.isOwnListing && !jobs.some((x) => x.id === j.id));
    return jobsTotal + ownOnly.length;
  }, [jobsTotal, salaryFilteredJobs, jobs, user?.can_hire]);

  function handleContactRecorded(_jobId: string, _limits?: FeedLimits) {}

  function clearFilters() {
    setRoleId("");
    setSalaryBand("all");
  }

  const hasActiveFilters = Boolean(roleId || salaryBand !== "all");
  const loading = listingTab === "jobs" ? jobsLoading : workersLoading;
  const error = listingTab === "jobs" ? jobsError : workersError;

  async function loadMoreJobs() {
    if (!jobsHasMore || jobsLoadingMore) return;
    setJobsLoadingMore(true);
    try {
      await fetchJobsFeed(jobsOffset, true);
    } catch (e: unknown) {
      setJobsError(e instanceof Error ? e.message : "Could not load more");
    } finally {
      setJobsLoadingMore(false);
    }
  }

  async function loadMoreWorkers() {
    if (!workersHasMore || workersLoadingMore) return;
    setWorkersLoadingMore(true);
    try {
      await fetchWorkersFeed(workersOffset, true);
    } catch (e: unknown) {
      setWorkersError(e instanceof Error ? e.message : "Could not load more");
    } finally {
      setWorkersLoadingMore(false);
    }
  }

  async function refreshAfterPost() {
    await Promise.all([
      fetchJobsFeed(0, false),
      user?.can_hire
        ? fetch("/api/auth/activity")
            .then((r) => r.json())
            .then((data: ActivityResponse) => setMyListings(data.myListings ?? []))
        : Promise.resolve(),
    ]).catch(() => {});
  }

  const { displayName } = ACTIVE_MARKET;
  const showShell = userLoading && !user;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {user ? <AppNavbar user={user} cityId={cityId} onCityChange={setCityId} /> : showShell ? (
        <header className="h-14 shrink-0 animate-pulse border-b border-border bg-surface" />
      ) : null}

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
                {listingTab === "jobs" ? `Jobs in ${displayName}` : `Workers in ${displayName}`}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {loading ? (
                  "Loading…"
                ) : listingTab === "jobs" ? (
                  <>
                    <span className="font-medium text-foreground">{displayJobsTotal}</span> open roles · Maids, cooks
                    &amp; shop helpers
                  </>
                ) : (
                  <>
                    <span className="font-medium text-foreground">{workersTotal}</span> workers looking for work
                  </>
                )}
              </p>
              <FeedListingTabs active={listingTab} onChange={setListingTab} />
            </header>

            {listingTab === "jobs" ? <NearbyHighlights items={highlights} /> : null}

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
                <p className="font-medium">{error}</p>
                <p className="mt-2 text-red-800/80">Make sure the backend is running.</p>
              </div>
            ) : null}

            {listingTab === "jobs" ? (
              <>
                {user && featured && !jobsLoading && !jobsError ? (
                  <section className="mt-6" aria-label="Featured job">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Featured</p>
                    <FeaturedJobCard job={featured} user={user} onContactRecorded={handleContactRecorded} />
                  </section>
                ) : null}

                {jobsLoading ? (
                  <CardSkeletonGrid />
                ) : gridJobs.length === 0 && !jobsError ? (
                  <EmptyState
                    message={`No jobs match these filters in ${displayName}. Try another role or salary band.`}
                  />
                ) : !user ? (
                  <CardSkeletonGrid />
                ) : (
                  <>
                    <ul className="mt-6 grid list-none grid-cols-1 gap-4 sm:grid-cols-2 sm:items-stretch">
                      {gridJobs.map((job) => (
                        <li key={job.id} className="flex min-h-[19.5rem] min-w-0 sm:min-h-[20.5rem]">
                          <FeedJobCard job={job} user={user} onContactRecorded={handleContactRecorded} />
                        </li>
                      ))}
                    </ul>
                    {jobsHasMore ? (
                      <LoadMoreButton loading={jobsLoadingMore} label="Load more jobs" onClick={loadMoreJobs} />
                    ) : null}
                  </>
                )}
              </>
            ) : workersLoading ? (
              <CardSkeletonGrid />
            ) : salaryFilteredWorkers.length === 0 && !workersError ? (
              <EmptyState
                message={`No workers match these filters in ${displayName}. Try another role or salary band.`}
              />
            ) : !user ? (
              <CardSkeletonGrid />
            ) : (
              <>
                <ul className="mt-6 grid list-none grid-cols-1 gap-4 sm:grid-cols-2 sm:items-stretch">
                  {salaryFilteredWorkers.map((worker) => (
                    <li key={worker.id} className="flex min-h-[19.5rem] min-w-0 sm:min-h-[20.5rem]">
                      <WorkerFeedCard worker={worker} user={user} />
                    </li>
                  ))}
                </ul>
                {workersHasMore ? (
                  <LoadMoreButton loading={workersLoadingMore} label="Load more workers" onClick={loadMoreWorkers} />
                ) : null}
              </>
            )}
          </div>
        </main>
      </div>

      {user && isRecruiterView(user) && listingTab === "jobs" ? (
        <>
          <PostJobFab onClick={() => setPostJobOpen(true)} />
          <JobListingModal
            open={postJobOpen}
            cityId={cityId}
            onClose={() => setPostJobOpen(false)}
            onSuccess={() => refreshAfterPost()}
          />
        </>
      ) : null}
    </div>
  );
}

function CardSkeletonGrid() {
  return (
    <ul className="mt-6 grid list-none grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i}>
          <div className="h-full min-h-[19.5rem] animate-pulse rounded-2xl bg-slate-200/60 sm:min-h-[20.5rem]" />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-4 py-12 text-center text-sm text-muted">
      {message}
    </p>
  );
}

function LoadMoreButton({
  loading,
  label,
  onClick,
}: {
  loading: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="mt-8 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="min-h-11 rounded-full border border-border bg-surface px-8 text-sm font-semibold text-foreground transition hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? "Loading…" : label}
      </button>
    </div>
  );
}
