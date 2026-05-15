"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActivityResponse } from "@/lib/jobs/activity";
import type { FeedJob } from "@/lib/jobs/types";
import { isRecruiterView } from "@/lib/jobs/viewerRole";
import { useFeedUser } from "./FeedUserProvider";
import { AppNavbar } from "./AppNavbar";
import { MyListingsSection } from "./MyListingsSection";
import { PostJobFab } from "./PostJobFab";
import { PostJobModal } from "./PostJobModal";

export function MyListingsPageContent() {
  const { user, userLoading, cityId, setCityId } = useFeedUser();
  const [listings, setListings] = useState<FeedJob[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postJobOpen, setPostJobOpen] = useState(false);

  const loadListings = useCallback(async () => {
    setListingsLoading(true);
    setError(null);
    try {
      const actRes = await fetch("/api/auth/activity");
      const actData = (await actRes.json()) as ActivityResponse;
      if (!actRes.ok) {
        setError(actData.error || "Could not load your listings");
        setListings([]);
        return;
      }
      setListings(actData.myListings ?? []);
    } catch {
      setError("Could not load your listings");
      setListings([]);
    } finally {
      setListingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.can_hire) {
      setListings([]);
      setListingsLoading(false);
      return;
    }
    loadListings();
  }, [user?.can_hire, user?.id, loadListings]);

  const showNavbar = user || userLoading;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {showNavbar && user ? (
        <AppNavbar user={user} cityId={cityId} onCityChange={setCityId} />
      ) : showNavbar ? (
        <header className="h-14 shrink-0 animate-pulse border-b border-border bg-surface" />
      ) : null}

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-4 py-6 pb-24 sm:px-6">
          {!userLoading && user && !user.can_hire ? (
            <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-12 text-center text-sm text-muted">
              My listings are available for employer accounts. Post a job or complete hiring setup on WhatsApp.
            </p>
          ) : (
            <>
              {error ? (
                <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
              ) : null}
              <MyListingsSection listings={listings} loading={listingsLoading || userLoading} />
            </>
          )}
        </div>
      </main>

      {user && isRecruiterView(user) ? (
        <>
          <PostJobFab onClick={() => setPostJobOpen(true)} />
          <PostJobModal
            open={postJobOpen}
            cityId={cityId}
            onClose={() => setPostJobOpen(false)}
            onSuccess={() => loadListings()}
          />
        </>
      ) : null}
    </div>
  );
}
