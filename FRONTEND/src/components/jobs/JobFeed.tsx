"use client";

import { useCallback, useEffect, useState } from "react";
import type { MeUser } from "@/lib/auth/types";
import type { FeedJob, FeedLimits, FeedResponse } from "@/lib/jobs/types";
import { AuthenticatedJobCard } from "./AuthenticatedJobCard";
import { FeedUsageBanner } from "./FeedUsageBanner";
import { JobCard } from "./JobCard";
import { JobFeedFilters } from "./JobFeedFilters";

type SortOption = "newest" | "salary_high" | "salary_low";

const PAGE_SIZE = 12;

type Props = {
  /** Public landing feed vs signed-in feed page */
  variant?: "public" | "authenticated";
};

export function JobFeed({ variant = "public" }: Props) {
  const isAuth = variant === "authenticated";

  const [user, setUser] = useState<MeUser | null>(null);
  const [limits, setLimits] = useState<FeedLimits | null>(null);
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());

  const [jobs, setJobs] = useState<FeedJob[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuth) return;
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.user) setUser(data.user as MeUser);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuth]);

  const fetchFeed = useCallback(
    async (nextOffset: number, append: boolean) => {
      const params = new URLSearchParams({
        offset: String(nextOffset),
        limit: String(PAGE_SIZE),
        sort,
      });
      if (city) params.set("city", city);
      if (category) params.set("category", category);

      const resp = await fetch(`/api/feed?${params}`);
      const data = (await resp.json()) as FeedResponse;

      if (!resp.ok) {
        throw new Error(data.error || "Could not load jobs");
      }

      setTotal(data.total);
      setHasMore(data.hasMore);
      setOffset(data.offset + data.jobs.length);
      setJobs((prev) => (append ? [...prev, ...data.jobs] : data.jobs));
      if (data.meta?.cities?.length) setCities(data.meta.cities);
      if (data.meta?.categories?.length) setCategories(data.meta.categories);
      if (data.limits) {
        setLimits(data.limits);
        setContactedIds(new Set(data.limits.contactedJobIds));
      }
    },
    [city, category, sort],
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

  function handleContactRecorded(jobId: string, nextLimits?: FeedLimits) {
    setContactedIds((prev) => new Set(prev).add(jobId));
    if (nextLimits) {
      setLimits(nextLimits);
      setContactedIds(new Set(nextLimits.contactedJobIds));
    } else if (limits) {
      setContactedIds((prev) => new Set(prev).add(jobId));
    }
  }

  const contactsRemaining = limits?.feedContacts.remaining ?? 0;
  const hasActiveFilters = Boolean(city || category);

  return (
    <section id="jobs" className="overflow-x-hidden py-10 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-3xl">
              {isAuth ? "Job feed" : "Open jobs"}
            </h2>
            <p className="mt-1 text-sm text-muted sm:text-base">
              {loading ? (
                "Loading…"
              ) : (
                <>
                  <span className="font-medium text-foreground">{total}</span>
                  {isAuth ? (
                    <span> listings — apply or message employers</span>
                  ) : (
                    <>
                      <span className="hidden sm:inline"> role{total === 1 ? "" : "s"} — no sign-in needed to browse</span>
                      <span className="sm:hidden"> jobs · browse free</span>
                    </>
                  )}
                </>
              )}
            </p>
            {isAuth && user ? (
              <p className="mt-1 text-xs text-muted">
                Signed in as {user.name || user.phone}
                {user.can_seek && user.can_hire
                  ? ` · ${user.current_mode === "recruiter" ? "Hiring" : "Looking for work"} mode`
                  : user.can_seek
                    ? " · Worker"
                    : user.can_hire
                      ? " · Employer"
                      : ""}
              </p>
            ) : null}
          </div>

          {isAuth && limits ? <FeedUsageBanner limits={limits} /> : null}

          <JobFeedFilters
            city={city}
            category={category}
            sort={sort}
            cities={cities}
            categories={categories}
            onCityChange={setCity}
            onCategoryChange={setCategory}
            onSortChange={setSort}
          />

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setCity("");
                setCategory("");
              }}
              className="text-sm font-medium text-brand underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {error ? (
          <div
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            <p className="font-medium">{error}</p>
            <p className="mt-2 text-red-800/80">Make sure the backend is running on port 5000.</p>
          </div>
        ) : null}

        {loading ? (
          <ul className="mt-6 grid list-none grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex min-h-[22rem] min-w-0">
                <div className="h-full w-full animate-pulse rounded-2xl bg-slate-200/60" />
              </li>
            ))}
          </ul>
        ) : jobs.length === 0 && !error ? (
          <p className="mt-6 rounded-2xl border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-muted sm:mt-10">
            No jobs match these filters. Try clearing city or category.
          </p>
        ) : (
          <>
            <ul className="mt-6 grid list-none grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {jobs.map((job) => (
                <li key={job.id} className="flex min-w-0">
                  {isAuth && !user ? (
                    <div className="h-full w-full min-h-[22rem] animate-pulse rounded-2xl bg-slate-200/60" />
                  ) : isAuth && user ? (
                    <AuthenticatedJobCard
                      job={job}
                      user={user}
                      contacted={contactedIds.has(job.id)}
                      contactsRemaining={contactsRemaining}
                      onContactRecorded={handleContactRecorded}
                    />
                  ) : (
                    <JobCard job={job} />
                  )}
                </li>
              ))}
            </ul>
            {hasMore ? (
              <div className="mt-6 sm:mt-8">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex min-h-12 w-full items-center justify-center rounded-full border border-border bg-surface px-6 text-sm font-semibold text-foreground transition hover:bg-slate-50 disabled:opacity-50 sm:mx-auto sm:min-h-0 sm:w-auto"
                >
                  {loadingMore ? "Loading…" : "Load more jobs"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
