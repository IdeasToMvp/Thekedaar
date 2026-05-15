"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MeResponse, MeUser } from "@/lib/auth/types";
import type { ActivityResponse } from "@/lib/jobs/activity";
import type { FeedJob } from "@/lib/jobs/types";
import { AppNavbar } from "./AppNavbar";
import { MyListingsSection } from "./MyListingsSection";
import { ACTIVE_MARKET } from "@/lib/launch";

export function MyListingsPageContent() {
  const [user, setUser] = useState<MeUser | null>(null);
  const [listings, setListings] = useState<FeedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cityId, setCityId] = useState(ACTIVE_MARKET.defaultCityId);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch("/api/auth/me"), fetch("/api/auth/activity")])
      .then(async ([meRes, actRes]) => {
        const meData = (await meRes.json()) as MeResponse;
        const actData = (await actRes.json()) as ActivityResponse;
        if (!cancelled) {
          if (meData?.user) {
            const u = { ...meData.user };
            if (meData.recruiter_profile) u.can_hire = true;
            setUser(u);
          }
          if (!actRes.ok) {
            setError(actData.error || "Could not load your listings");
            setListings([]);
          } else {
            setListings(actData.myListings ?? []);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your listings");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  if (!user.can_hire) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <AppNavbar user={user} cityId={cityId} onCityChange={setCityId} />
        <main className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
          <p className="text-muted">My listings are available for employer accounts.</p>
          <Link href="/feed" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            Back to job feed
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden bg-background">
      <AppNavbar user={user} cityId={cityId} onCityChange={setCityId} />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
          <Link href="/feed" className="text-sm font-medium text-brand hover:underline">
            ← Back to find jobs
          </Link>
          {error ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
          ) : null}
          <MyListingsSection listings={listings} loading={loading} />
        </div>
      </main>
    </div>
  );
}
