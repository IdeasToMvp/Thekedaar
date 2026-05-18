"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import Link from "next/link";
import type { ApplicationStatus, FeedJob, FeedResponse } from "@/lib/jobs/types";
import type { FeedWorker, HiredWorker, WorkerHireLimits, WorkersFeedResponse } from "@/lib/workers/types";
import { isEmployerAccount, isWorkerAccount } from "@/lib/auth/accountRole";
import { filterWorkersBySalary, filterWorkersToLaunchMarket } from "@/lib/workers/filterWorkers";
import {
  ACTIVE_MARKET,
  cityToApiParam,
  filterJobsBySalary,
  filterJobsToLaunchMarket,
  getLaunchCity,
  launchHighlights,
  roleToApiParam,
  type SalaryBandId,
} from "@/lib/launch";
import { useFeedUser } from "./FeedUserProvider";
import { AppNavbar } from "./AppNavbar";
import { FeedSidebar } from "./FeedSidebar";
import { FeedMobileFilters } from "./FeedMobileFilters";
import { FeedJobCard } from "./FeedJobCard";
import { WorkerFeedCard } from "./WorkerFeedCard";
import { NearbyHighlights } from "./NearbyHighlights";

const PAGE_SIZE = 24;

type SortOption = "newest" | "salary_high" | "salary_low";

export function FeedPageContent() {
  const { user, userLoading, cityId, setCityId } = useFeedUser();

  const employer = user ? isEmployerAccount(user) : false;
  const worker = user ? isWorkerAccount(user) : false;

  const [jobs, setJobs] = useState<FeedJob[]>([]);
  const [workers, setWorkers] = useState<FeedWorker[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [workersTotal, setWorkersTotal] = useState(0);
  const [jobsOffset, setJobsOffset] = useState(0);
  const [workersOffset, setWorkersOffset] = useState(0);
  const [jobsHasMore, setJobsHasMore] = useState(false);
  const [workersHasMore, setWorkersHasMore] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [jobsLoadingMore, setJobsLoadingMore] = useState(false);
  const [workersLoadingMore, setWorkersLoadingMore] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [workersError, setWorkersError] = useState<string | null>(null);
  const [contactedWorkerIds, setContactedWorkerIds] = useState<Set<string>>(new Set());
  const [walletBalanceInr, setWalletBalanceInr] = useState<number | null>(null);
  const [unlockCostInr, setUnlockCostInr] = useState(20);

  const [roleId, setRoleId] = useState("");
  const [salaryBand, setSalaryBand] = useState<SalaryBandId>("all");
  const [sector, setSector] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQ = useDebouncedValue(searchQuery.trim(), 400);
  const [sort] = useState<SortOption>("newest");
  const searchPending = searchQuery.trim() !== debouncedQ;

  useEffect(() => {
    setSector("");
  }, [cityId]);

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
      if (sector) params.set("sector", sector);
      if (debouncedQ) params.set("q", debouncedQ);

      const resp = await fetch(`/api/feed?${params}`);
      const data = (await resp.json()) as FeedResponse;
      if (!resp.ok) throw new Error(data.error || "Could not load jobs");

      const scoped = filterJobsToLaunchMarket(data.jobs, cityId, roleId);
      setJobsTotal(scoped.length < data.jobs.length ? scoped.length : data.total);
      setJobsHasMore(data.hasMore);
      setJobsOffset(data.offset + data.jobs.length);
      setJobs((prev) => (append ? [...prev, ...scoped] : scoped));
    },
    [cityId, roleId, sector, debouncedQ, sort],
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
      if (sector) params.set("sector", sector);
      if (debouncedQ) params.set("q", debouncedQ);

      const resp = await fetch(`/api/workers/feed?${params}`);
      const data = (await resp.json()) as WorkersFeedResponse;
      if (!resp.ok) throw new Error(data.error || "Could not load workers");

      const scoped = filterWorkersToLaunchMarket(data.workers, cityId, roleId);
      setWorkersTotal(scoped.length < data.workers.length ? scoped.length : data.total);
      setWorkersHasMore(data.hasMore);
      setWorkersOffset(data.offset + data.workers.length);
      setWorkers((prev) => (append ? [...prev, ...scoped] : scoped));
      if (!append) {
        if (data.contactedWorkerIds) {
          setContactedWorkerIds(new Set(data.contactedWorkerIds));
        }
        if (data.limits?.wallet) {
          setWalletBalanceInr(data.limits.wallet.balanceInr);
          setUnlockCostInr(data.limits.wallet.unlockCostInr);
        }
      }
    },
    [cityId, roleId, sector, debouncedQ, sort],
  );

  const handleWorkerHired = useCallback((hired: HiredWorker, limits?: WorkerHireLimits) => {
    setContactedWorkerIds((prev) => new Set(prev).add(hired.id));
    if (limits?.wallet) {
      setWalletBalanceInr(limits.wallet.balanceInr);
      setUnlockCostInr(limits.wallet.unlockCostInr);
    }
  }, []);

  useEffect(() => {
    if (!worker) return;
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
  }, [fetchJobsFeed, worker]);

  useEffect(() => {
    if (!employer || !user) return;
    fetch("/api/workers/contacted")
      .then((r) => r.json())
      .then((data: { limits?: WorkerHireLimits; contacted?: { workerId: string }[] }) => {
        if (data.limits?.wallet) {
          setWalletBalanceInr(data.limits.wallet.balanceInr);
          setUnlockCostInr(data.limits.wallet.unlockCostInr);
        }
        if (data.contacted?.length) {
          setContactedWorkerIds(new Set(data.contacted.map((c) => c.workerId)));
        }
      })
      .catch(() => {});
  }, [employer, user]);

  useEffect(() => {
    if (!employer) return;
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
  }, [fetchWorkersFeed, employer]);

  const salaryFilteredJobs = useMemo(() => filterJobsBySalary(jobs, salaryBand), [jobs, salaryBand]);
  const salaryFilteredWorkers = useMemo(
    () => filterWorkersBySalary(workers, salaryBand),
    [workers, salaryBand],
  );

  const highlights = useMemo(() => launchHighlights(salaryFilteredJobs), [salaryFilteredJobs]);

  const handleApplicationUpdated = useCallback((jobId: string, status: ApplicationStatus) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, applicationStatus: status } : j)),
    );
  }, []);

  function clearFilters() {
    setRoleId("");
    setSalaryBand("all");
    setSector("");
    setSearchQuery("");
  }

  const hasActiveFilters = Boolean(roleId || salaryBand !== "all" || sector || searchQuery.trim());
  const loading = worker ? jobsLoading : workersLoading;
  const error = worker ? jobsError : workersError;
  const cityLabel = getLaunchCity(cityId)?.label ?? ACTIVE_MARKET.displayName;
  const searchPlaceholder = worker
    ? "Search jobs by title, role, area…"
    : "Search workers by name, role, area…";
  const showShell = userLoading && !user;

  if (user && !employer && !worker) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <AppNavbar user={user} cityId={cityId} onCityChange={setCityId} />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-muted">Your account is not set up yet.</p>
          <Link href="/feed/profile" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            Complete profile
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {user ? <AppNavbar user={user} cityId={cityId} onCityChange={setCityId} /> : showShell ? (
        <header className="h-14 shrink-0 animate-pulse border-b border-border bg-surface" />
      ) : null}

      <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1">
        <div className="hidden w-56 shrink-0 overflow-y-auto overscroll-contain border-r border-border xl:w-60 lg:block">
          <FeedSidebar
            cityId={cityId}
            roleId={roleId}
            salaryBand={salaryBand}
            sector={sector}
            searchQuery={searchQuery}
            onRoleChange={setRoleId}
            onSalaryBandChange={setSalaryBand}
            onSectorChange={setSector}
            onSearchChange={setSearchQuery}
            onClear={clearFilters}
            searchPlaceholder={searchPlaceholder}
          />
        </div>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border px-4 py-4 sm:px-6 lg:hidden">
            <FeedMobileFilters
              cityId={cityId}
              roleId={roleId}
              salaryBand={salaryBand}
              sector={sector}
              searchQuery={searchQuery}
              onRoleChange={setRoleId}
              onSalaryBandChange={setSalaryBand}
              onSectorChange={setSector}
              onSearchChange={setSearchQuery}
              searchPlaceholder={searchPlaceholder}
            />
            {hasActiveFilters ? (
              <button type="button" onClick={clearFilters} className="mt-3 text-sm font-medium text-brand hover:underline">
                Clear filters
              </button>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 pb-24 sm:px-6">
            <header>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {worker ? `Jobs in ${cityLabel}` : `Workers in ${cityLabel}`}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {loading || searchPending ? (
                  searchPending ? "Searching…" : "Loading…"
                ) : worker ? (
                  <>
                    <span className="font-medium text-foreground">{jobsTotal}</span> open roles
                  </>
                ) : (
                  <>
                    <span className="font-medium text-foreground">{workersTotal}</span> workers · contact details hidden
                  </>
                )}
              </p>
            </header>

            {worker ? <NearbyHighlights items={highlights} /> : null}

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
                <p className="font-medium">{error}</p>
              </div>
            ) : null}

            {worker ? (
              <>
                {jobsLoading ? (
                  <CardSkeletonGrid />
                ) : salaryFilteredJobs.length === 0 && !jobsError ? (
                  <EmptyState message={`No jobs match these filters in ${cityLabel}.`} />
                ) : !user ? (
                  <CardSkeletonGrid />
                ) : (
                  <>
                    <ul className="mt-6 grid list-none grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:items-stretch">
                      {salaryFilteredJobs.map((job) => (
                        <li key={job.id} className="flex min-w-0">
                          <FeedJobCard job={job} user={user} onApplicationUpdated={handleApplicationUpdated} />
                        </li>
                      ))}
                    </ul>
                    {jobsHasMore ? (
                      <LoadMoreButton
                        loading={jobsLoadingMore}
                        label="Load more jobs"
                        onClick={async () => {
                          if (!jobsHasMore || jobsLoadingMore) return;
                          setJobsLoadingMore(true);
                          try {
                            await fetchJobsFeed(jobsOffset, true);
                          } catch (e: unknown) {
                            setJobsError(e instanceof Error ? e.message : "Could not load more");
                          } finally {
                            setJobsLoadingMore(false);
                          }
                        }}
                      />
                    ) : null}
                  </>
                )}
              </>
            ) : workersLoading ? (
              <CardSkeletonGrid />
            ) : salaryFilteredWorkers.length === 0 && !workersError ? (
              <EmptyState message={`No workers match these filters in ${cityLabel}.`} />
            ) : !user ? (
              <CardSkeletonGrid />
            ) : (
              <>
                <ul className="mt-6 grid list-none grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:items-stretch">
                  {salaryFilteredWorkers.map((w) => (
                    <li key={w.id} className="flex min-w-0">
                      <WorkerFeedCard
                        worker={w}
                        user={user}
                        hired={contactedWorkerIds.has(w.id)}
                        walletBalanceInr={walletBalanceInr ?? undefined}
                        unlockCostInr={unlockCostInr}
                        onHired={handleWorkerHired}
                      />
                    </li>
                  ))}
                </ul>
                {workersHasMore ? (
                  <LoadMoreButton
                    loading={workersLoadingMore}
                    label="Load more workers"
                    onClick={async () => {
                      if (!workersHasMore || workersLoadingMore) return;
                      setWorkersLoadingMore(true);
                      try {
                        await fetchWorkersFeed(workersOffset, true);
                      } catch (e: unknown) {
                        setWorkersError(e instanceof Error ? e.message : "Could not load more");
                      } finally {
                        setWorkersLoadingMore(false);
                      }
                    }}
                  />
                ) : null}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function CardSkeletonGrid() {
  return (
    <ul className="mt-6 grid list-none grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i}>
          <div className="h-36 animate-pulse rounded-2xl bg-slate-200/60" />
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
