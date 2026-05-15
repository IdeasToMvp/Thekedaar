import type { FeedJob } from "@/lib/jobs/types";
import { getJobDetailCells, getJobRequirementCells } from "@/lib/jobs/listingDetails";
import { FeedDetailGrid } from "./FeedDetailGrid";

type Props = {
  job: FeedJob;
  className?: string;
};

export function JobListingMeta({ job, className = "" }: Props) {
  const details = getJobDetailCells(job);
  const requirements = getJobRequirementCells(job);

  return (
    <div className={className}>
      <FeedDetailGrid items={details} />
      {requirements.length > 0 ? (
        <div className="mt-2 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-dark">Candidate requirements</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-foreground">{requirements[0]?.value}</p>
        </div>
      ) : null}
    </div>
  );
}
