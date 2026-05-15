import type { FeedWorker } from "@/lib/workers/types";
import { getWorkerDetailItems } from "@/lib/workers/workerDetails";

type Props = {
  worker: FeedWorker;
  compact?: boolean;
  className?: string;
};

export function WorkerListingMeta({ worker, compact = false, className = "" }: Props) {
  const items = getWorkerDetailItems(worker);
  if (items.length === 0) return null;

  return (
    <ul
      className={`list-none space-y-1 ${compact ? "text-xs" : "text-sm"} ${className}`.trim()}
      aria-label="Worker profile details"
    >
      {items.map((item) => (
        <li key={item.key} className="flex gap-1.5 leading-snug">
          <span className="shrink-0 font-medium text-muted">{item.label}:</span>
          <span className="min-w-0 text-foreground">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
