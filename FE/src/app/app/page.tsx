"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageShell } from "@/components/PageShell";
import { JobFeedCard } from "@/components/jobs/JobFeedCard";
import { DUMMY_JOB_LISTINGS } from "@/lib/jobs/dummyJobs";
import { filterJobs, sortJobs, uniqueCategories, uniqueCities } from "@/lib/jobs/filterSort";
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

export default function AppPage() {
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [sortKey, setSortKey] = useState<JobSortKey>("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(() => new Set());
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadLock = useRef(false);

  const cities = useMemo(() => uniqueCities(DUMMY_JOB_LISTINGS), []);
  const categories = useMemo(() => uniqueCategories(DUMMY_JOB_LISTINGS), []);

  const viewerSubscription: SubscriptionSnapshot = useMemo(
    () => normalizeSubscriptionFromApi(user?.subscription),
    [user?.subscription],
  );

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
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const filteredSorted = useMemo(
    () => sortJobs(filterJobs(DUMMY_JOB_LISTINGS, { city, category }), sortKey),
    [city, category, sortKey],
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [city, category, sortKey]);

  const visibleJobs = useMemo(
    () => filteredSorted.slice(0, visibleCount),
    [filteredSorted, visibleCount],
  );

  const hasMore = visibleCount < filteredSorted.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const ob = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit || loadLock.current) return;
        loadLock.current = true;
        setVisibleCount((c) => Math.min(c + PAGE_SIZE, filteredSorted.length));
        requestAnimationFrame(() => {
          loadLock.current = false;
        });
      },
      { root: null, rootMargin: "320px 0px", threshold: 0 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [hasMore, filteredSorted.length, visibleCount]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  const onApply = useCallback((job: JobListing) => {
    setAppliedIds((prev) => new Set(prev).add(job.id));
  }, []);

  if (loading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="h-10 w-10 rounded-full border-2 border-emerald-200 border-t-emerald-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm font-medium text-slate-600">Loading feed…</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="items-start justify-start py-4 sm:py-6">
      <div className="mx-auto flex w-full max-w-lg flex-col px-3 sm:max-w-xl sm:px-4">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Feed</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              <span className="font-mono text-slate-700">{user?.phone}</span>
              <span className="mx-1.5">·</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700 ring-1 ring-slate-200/80">
                {viewerSubscription.plan} plan
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/app/profile"
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Profile
            </Link>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => void logout()}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900"
            >
              Logout
            </motion.button>
          </div>
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

        <p className="mb-3 text-center text-xs text-slate-500">
          Showing {visibleJobs.length} of {filteredSorted.length} listings (demo data)
        </p>

        <div className="flex flex-col gap-5 pb-10">
          {filteredSorted.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 py-12 text-center text-sm text-slate-600">
              No demo listings match your filters. Try clearing city or role.
            </p>
          ) : (
            visibleJobs.map((job) => (
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

        <div ref={sentinelRef} className="flex min-h-12 items-center justify-center py-4" aria-hidden={!hasMore}>
          {hasMore ? (
            <motion.div
              className="h-8 w-8 rounded-full border-2 border-emerald-100 border-t-emerald-600"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : filteredSorted.length === 0 ? (
            <p className="text-center text-sm font-medium text-slate-500">No listings match these filters.</p>
          ) : (
            <p className="text-center text-sm font-medium text-slate-500">You&apos;re up to date.</p>
          )}
        </div>
      </div>
    </PageShell>
  );
}
