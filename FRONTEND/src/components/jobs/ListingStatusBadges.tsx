import type { FeedJob } from "@/lib/jobs/types";

type Props = {
  job: FeedJob;
  className?: string;
};

export function ListingStatusBadges({ job, className = "" }: Props) {
  const closed = job.listingStatus === "closed";
  const edited = (job.editCount ?? 0) > 0;

  if (!closed && !edited) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {closed ? (
        <span className="rounded-full bg-slate-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
          Closed
        </span>
      ) : null}
      {edited && !closed ? (
        <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-900">
          Edited
        </span>
      ) : null}
    </div>
  );
}
