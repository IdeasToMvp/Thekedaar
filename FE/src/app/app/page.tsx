"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageShell } from "@/components/PageShell";
import { JobFeedCard } from "@/components/jobs/JobFeedCard";
import type { JobListing, JobSortKey } from "@/lib/jobs/types";
import { normalizeSubscriptionFromApi, type SubscriptionSnapshot } from "@/lib/subscription";

const PAGE_SIZE = 8;

type MeUser = {
  id: string;
  phone: string;
  role: string;
  hiring_enabled: boolean;
  seeking_enabled: boolean;
  name: string | null;
  city: string | null;
  subscription?: unknown;
};

type FeedApiResponse = {
  jobs: JobListing[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  meta?: { cities: string[]; categories: string[] };
};

function feedQuery(offset: number, limit: number, city: string, category: string, sort: JobSortKey): string {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
    sort,
  });
  if (city) params.set("city", city);
  if (category) params.set("category", category);
  return `/api/feed?${params.toString()}`;
}

export default function AppPage() {
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [sortKey, setSortKey] = useState<JobSortKey>("newest");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [total, setTotal] = useState(0);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(() => new Set());
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const jobsRef = useRef<JobListing[]>([]);
  const totalRef = useRef(0);
  const feedLoadingRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const loadMoreLock = useRef(false);

  jobsRef.current = jobs;
  totalRef.current = total;
  feedLoadingRef.current = feedLoading;

  const viewerSubscription: SubscriptionSnapshot = useMemo(
    () => normalizeSubscriptionFromApi(user?.subscription),
    [user?.subscription],
  );

  const hasMore = jobs.length < total;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data?.user) {
          if (!cancelled) router.replace("/login");
          return;
        }
        if (!cancelled) setUser(data.user as MeUser);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFeedLoading(true);
      setFeedError(null);
      setJobs([]);
      try {
        const url = feedQuery(0, PAGE_SIZE, city, category, sortKey);
        const resp = await fetch(url, { cache: "no-store" });
        const data = (await resp.json().catch(() => ({}))) as FeedApiResponse & { error?: string };
        if (cancelled) return;
        if (!resp.ok) {
          setFeedError(typeof data?.error === "string" ? data.error : "Could not load feed");
          return;
        }
        setJobs(data.jobs ?? []);
        setTotal(data.total ?? 0);
        if (data.meta?.cities?.length) setCities(data.meta.cities);
        if (data.meta?.categories?.length) setCategories(data.meta.categories);
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [city, category, sortKey]);

  const loadMore = useCallback(async () => {
    if (loadMoreLock.current || feedLoadingRef.current || loadingMoreRef.current) return;
    const offset = jobsRef.current.length;
    const t = totalRef.current;
    if (offset >= t) return;

    loadMoreLock.current = true;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const url = feedQuery(offset, PAGE_SIZE, city, category, sortKey);
      const resp = await fetch(url, { cache: "no-store" });
      const data = (await resp.json().catch(() => ({}))) as FeedApiResponse & { error?: string };
      if (!resp.ok) return;
      const next = data.jobs ?? [];
      if (next.length === 0) return;
      setJobs((prev) => {
        const seen = new Set(prev.map((j) => j.id));
        const merged = [...prev];
        for (const j of next) {
          if (!seen.has(j.id)) {
            seen.add(j.id);
            merged.push(j);
          }
        }
        return merged;
      });
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
      loadMoreLock.current = false;
    }
  }, [city, category, sortKey]);

  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    if (feedLoading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit) return;
        void loadMoreRef.current();
      },
      { root: null, rootMargin: "480px 0px", threshold: 0 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [feedLoading, jobs.length, city, category, sortKey, total]);

  const onApply = useCallback((job: JobListing) => {
    setAppliedIds((prev) => new Set(prev).add(job.id));
  }, []);

  if (authLoading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="h-10 w-10 rounded-full border-2 border-emerald-200 border-t-emerald-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm font-medium text-slate-600">Loading…</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="items-start justify-start py-4 sm:py-6">
      <div className="mx-auto flex w-full max-w-lg flex-col px-3 sm:max-w-xl sm:px-4">
        <header className="mb-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Feed</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            <span className="font-mono text-slate-700">{user?.phone}</span>
            <span className="mx-1.5">·</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700 ring-1 ring-slate-200/80">
              {viewerSubscription.plan} plan
            </span>
          </p>
        </header>

        <section
          aria-label="Filters and sort"
          className="mb-5 grid gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-sm backdrop-blur-sm sm:grid-cols-3"
        >
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">City</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Role</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All roles</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Sort</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as JobSortKey)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="newest">Newest first</option>
              <option value="salary_high">Salary: high → low</option>
              <option value="salary_low">Salary: low → high</option>
            </select>
          </label>
        </section>

        {feedError ? (
          <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-800" role="alert">
            {feedError}
          </p>
        ) : null}

        <p className="mb-3 text-center text-xs text-slate-500">
          {feedLoading ? "Loading listings…" : `Showing ${jobs.length} of ${total} listings (demo data)`}
        </p>

        <div className="flex flex-col gap-5 pb-10">
          {feedLoading ? (
            <div className="flex justify-center py-12">
              <motion.div
                className="h-10 w-10 rounded-full border-2 border-emerald-200 border-t-emerald-600"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : total === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 py-12 text-center text-sm text-slate-600">
              No demo listings match your filters. Try clearing city or role.
            </p>
          ) : (
            jobs.map((job) => (
              <JobFeedCard
                key={job.id}
                job={job}
                viewerSubscription={viewerSubscription}
                applied={appliedIds.has(job.id)}
                onApply={onApply}
              />
            ))
          )}
        </div>

        <div ref={sentinelRef} className="flex min-h-14 items-center justify-center py-6">
          {feedLoading ? null : hasMore ? (
            loadingMore ? (
              <motion.div
                className="h-8 w-8 rounded-full border-2 border-emerald-100 border-t-emerald-600"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <span className="text-xs text-slate-400">Scroll for more</span>
            )
          ) : total === 0 ? (
            <p className="text-center text-sm font-medium text-slate-500">No listings match these filters.</p>
          ) : (
            <p className="text-center text-sm font-medium text-slate-500">You&apos;re up to date.</p>
          )}
        </div>
      </div>
    </PageShell>
  );
}
