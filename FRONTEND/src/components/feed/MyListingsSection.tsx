"use client";

import Link from "next/link";
import type { FeedJob } from "@/lib/jobs/types";
import { MyListingCard } from "./MyListingCard";
import { FeedSearchBar } from "./FeedSearchBar";

type Props = {
  listings: FeedJob[];
  loading?: boolean;
  compact?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onEditJob?: (job: FeedJob) => void;
  onCloseJob?: (job: FeedJob) => void;
};

export function MyListingsSection({
  listings,
  loading,
  compact = false,
  searchQuery = "",
  onSearchChange,
  onEditJob,
  onCloseJob,
}: Props) {
  const preview = compact ? listings.slice(0, 3) : listings;

  return (
    <section className="mt-6 border-t border-border pt-6" aria-labelledby="my-listings-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="my-listings-heading" className="text-lg font-bold text-foreground">
            My listings
          </h2>
          <p className="mt-0.5 text-sm text-muted">Jobs you posted for hiring</p>
        </div>
        {compact && listings.length > 3 ? (
          <Link
            href="/feed/my-listings"
            className="text-sm font-semibold text-brand underline-offset-2 hover:underline"
          >
            View all ({listings.length})
          </Link>
        ) : null}
      </div>

      {!compact && onSearchChange ? (
        <FeedSearchBar
          className="mt-4 max-w-md"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search your listings by title, role, area…"
        />
      ) : null}

      {loading ? (
        <ul className="mt-4 grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i}>
              <div className="h-48 animate-pulse rounded-2xl bg-slate-200/60" />
            </li>
          ))}
        </ul>
      ) : preview.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-slate-50/80 px-4 py-8 text-center text-sm text-muted">
          No listings yet. Use “Post a Job” to create your first listing.
        </p>
      ) : (
        <ul className="mt-4 grid list-none grid-cols-1 gap-3 sm:grid-cols-2 sm:items-stretch lg:grid-cols-3">
          {preview.map((job) => (
            <li key={job.id} className="flex min-w-0">
              <MyListingCard job={job} onEdit={onEditJob} onClose={onCloseJob} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
