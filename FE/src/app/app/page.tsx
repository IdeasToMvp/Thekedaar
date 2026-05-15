"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageShell } from "@/components/PageShell";
import { JobFeedCard } from "@/components/jobs/JobFeedCard";
import type { JobListing, JobSortKey } from "@/lib/jobs/types";
import type { FeedLimits } from "@/lib/planLimits";
import { canContactMoreJobs } from "@/lib/subscription";
import { buildWhatsAppUrl } from "@/lib/jobs/whatsapp";

const PAGE_SIZE = 8;

type MeUser = {
  id: string;
  phone: string;
  name: string | null;
  city: string | null;
  current_mode: "worker" | "recruiter";
  can_seek: boolean;
  can_hire: boolean;
  subscription?: unknown;
};

type FeedApiResponse = {
  jobs: JobListing[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  limits?: FeedLimits;
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
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [limits, setLimits] = useState<FeedLimits | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const jobsRef = useRef<JobListing[]>([]);
  const totalRef = useRef(0);
  const feedLoadingRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const loadMoreLock = useRef(false);
  const scrollRestoreY = useRef<number | null>(null);

  jobsRef.current = jobs;
  totalRef.current = total;
  feedLoadingRef.current = feedLoading;

  const viewerMode = user?.current_mode ?? "worker";
  const contactedSet = useMemo(() => new Set(limits?.contactedJobIds ?? []), [limits?.contactedJobIds]);
  const canContactMore = canContactMoreJobs(limits);

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

  const applyFeedPayload = useCallback((data: FeedApiResponse, append: boolean) => {
    if (data.limits) setLimits(data.limits);
    if (append) {
      scrollRestoreY.current = window.scrollY;
      setJobs((prev) => {
        const seen = new Set(prev.map((j) => j.id));
        const merged = [...prev];
        for (const j of data.jobs ?? []) {
          if (!seen.has(j.id)) {
            seen.add(j.id);
            merged.push(j);
          }
        }
        return merged;
      });
    } else {
      setJobs(data.jobs ?? []);
    }
    setTotal(data.total ?? 0);
    if (data.meta?.cities?.length) setCities(data.meta.cities);
    if (data.meta?.categories?.length) setCategories(data.meta.categories);
  }, []);

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
        applyFeedPayload(data, false);
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [city, category, sortKey, applyFeedPayload]);

  const loadMore = useCallback(async () => {
    if (loadMoreLock.current || feedLoadingRef.current || loadingMoreRef.current) return;
    const offset = jobsRef.current.length;
    if (offset >= totalRef.current) return;

    loadMoreLock.current = true;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const url = feedQuery(offset, PAGE_SIZE, city, category, sortKey);
      const resp = await fetch(url, { cache: "no-store" });
      const data = (await resp.json().catch(() => ({}))) as FeedApiResponse;
      if (resp.ok) applyFeedPayload(data, true);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
      loadMoreLock.current = false;
    }
  }, [city, category, sortKey, applyFeedPayload]);

  useLayoutEffect(() => {
    if (scrollRestoreY.current !== null) {
      window.scrollTo(0, scrollRestoreY.current);
      scrollRestoreY.current = null;
    }
  }, [jobs]);

  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    if (feedLoading || loadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !loadingMoreRef.current) void loadMoreRef.current();
      },
      { root: null, rootMargin: "200px 0px", threshold: 0 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [feedLoading, loadingMore, jobs.length, city, category, sortKey, total]);

  const recordContact = useCallback(
    async (job: JobListing, action: "apply" | "whatsapp" | "hire") => {
      setActionError(null);
      if (!canContactMoreJobs(limits) && !contactedSet.has(job.id)) {
        setActionError("You’ve reached your contact limit for this plan.");
        return false;
      }
      setContactingId(job.id);
      try {
        const resp = await fetch(`/api/jobs/${job.id}/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          setActionError(typeof data?.error === "string" ? data.error : "Action failed");
          return false;
        }
        if (data.limits) setLimits(data.limits as FeedLimits);
        return true;
      } finally {
        setContactingId(null);
      }
    },
    [limits, contactedSet],
  );

  const onPrimary = useCallback(
    async (job: JobListing) => {
      const action = viewerMode === "recruiter" ? "hire" : "apply";
      await recordContact(job, action);
    },
    [viewerMode, recordContact],
  );

  const onWhatsApp = useCallback(
    async (job: JobListing) => {
      const intent = viewerMode === "recruiter" ? "hire" : "apply";
      const ok = await recordContact(job, "whatsapp");
      if (ok) window.open(buildWhatsAppUrl(job, intent), "_blank", "noopener,noreferrer");
    },
    [viewerMode, recordContact],
  );

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
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between gap-3"
          >
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {viewerMode === "recruiter" ? "Find staff" : "Jobs for you"}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Switch mode in{" "}
                <Link href="/app/profile" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
                  Profile
                </Link>
              </p>
            </div>
          </motion.div>
        </header>

        <section
          aria-label="Filters and sort"
          className="mb-5 grid gap-2 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm sm:grid-cols-3"
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
        {actionError ? (
          <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-center text-sm font-medium text-amber-900" role="alert">
            {actionError}
          </p>
        ) : null}

        <p className="mb-3 text-center text-xs text-slate-500">
          {feedLoading ? "Loading listings…" : `Showing ${jobs.length} of ${total} jobs`}
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
              No jobs match your filters. Try clearing city or role.
            </p>
          ) : (
            jobs.map((job) => (
              <JobFeedCard
                key={job.id}
                job={job}
                viewerMode={viewerMode}
                contacted={contactedSet.has(job.id)}
                canContactMore={canContactMore}
                contactLoading={contactingId === job.id}
                onPrimary={onPrimary}
                onWhatsApp={onWhatsApp}
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
          ) : total > 0 ? (
            <p className="text-center text-sm font-medium text-slate-500">You&apos;re up to date.</p>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
