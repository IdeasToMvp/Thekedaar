import type { FeedWorker } from "@/lib/workers/types";
import { getWorkerDetailCells } from "@/lib/workers/workerDetails";
import { FeedDetailGrid } from "./FeedDetailGrid";

type Props = {
  worker: FeedWorker;
  className?: string;
};

export function WorkerListingMeta({ worker, className = "" }: Props) {
  const items = getWorkerDetailCells(worker);
  return <FeedDetailGrid items={items} className={className} />;
}
