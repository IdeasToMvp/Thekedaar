import Link from "next/link";
import type { FeedLimits } from "@/lib/jobs/types";

export function FeedUsageBanner({ limits }: { limits: FeedLimits }) {
  if (limits.wallet) {
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm shadow-sm"
        role="status"
      >
        <p className="font-medium text-foreground">
          Theke Credits: <span className="font-serif text-lg">₹{limits.wallet.balanceInr}</span>
        </p>
        <Link href="/feed/wallet" className="shrink-0 text-sm font-semibold text-brand hover:underline">
          Add credits
        </Link>
      </div>
    );
  }

  const { used, max, remaining } = limits.feedContacts;
  if (max <= 0 || max > 100_000) return null;

  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm shadow-sm" role="status">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-foreground">
          Job contacts: {used} / {max} used
          <span className="ml-1 font-normal text-muted">({limits.plan} plan)</span>
        </p>
        <p className="text-muted">{remaining} remaining</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
