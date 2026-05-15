"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActivityResponse } from "@/lib/jobs/activity";
import type { FeedJob } from "@/lib/jobs/types";
import { isEmployerAccount } from "@/lib/auth/accountRole";
import { useFeedUser } from "./FeedUserProvider";
import { AppNavbar } from "./AppNavbar";
import { MyListingsSection } from "./MyListingsSection";
import { JobListingModal } from "./JobListingModal";
import { PostJobFab } from "./PostJobFab";

export function MyListingsPageContent() {
  const { user, userLoading, cityId, setCityId } = useFeedUser();
  const [listings, setListings] = useState<FeedJob[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<FeedJob | null>(null);

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
    if (!user || !isEmployerAccount(user)) {
      setListings([]);
      setListingsLoading(false);
      return;
    }
    loadListings();
  }, [user, loadListings]);

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
          {!userLoading && user && !isEmployerAccount(user) ? null : (
            <>
              {error ? (
                <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
              ) : null}
              <MyListingsSection
                listings={listings}
                loading={listingsLoading || userLoading}
                onEditJob={(job) => {
                  setEditingJob(job);
                  setListingModalOpen(true);
                }}
              />
            </>
          )}
        </div>
      </main>

      {user && isEmployerAccount(user) ? (
        <>
          <PostJobFab
            onClick={() => {
              setEditingJob(null);
              setListingModalOpen(true);
            }}
          />
          <JobListingModal
            open={listingModalOpen}
            cityId={cityId}
            job={editingJob}
            onClose={() => {
              setListingModalOpen(false);
              setEditingJob(null);
            }}
            onSuccess={() => loadListings()}
          />
        </>
      ) : null}
    </div>
  );
}
