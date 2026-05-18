"use client";

import { formatRelativeTime } from "@/lib/formatRelativeTime";
import {
  isCreditIn,
  walletTransactionDetail,
  walletTransactionLabel,
} from "@/lib/credits/transactionLabels";
import type { WalletTransaction } from "@/lib/credits/types";

type Props = {
  transactions: WalletTransaction[];
};

export function WalletTransactionHistory({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-slate-50/80 px-4 py-6 text-center text-sm text-muted">
        No credit activity yet. Top-ups and paid actions will appear here.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
      {transactions.map((tx) => {
        const incoming = isCreditIn(tx);
        const detail = walletTransactionDetail(tx);

        return (
          <li key={tx.id} className="flex items-start gap-3 bg-surface px-4 py-3.5">
            <span
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                incoming ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
              }`}
              aria-hidden
            >
              {incoming ? "+" : "−"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{walletTransactionLabel(tx)}</p>
              {detail ? <p className="mt-0.5 text-xs text-muted">{detail}</p> : null}
              <p className="mt-1 text-[11px] text-muted">{formatRelativeTime(tx.createdAt)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={`text-sm font-bold tabular-nums ${
                  incoming ? "text-emerald-700" : "text-foreground"
                }`}
              >
                {incoming ? "+" : "−"}₹{Math.abs(tx.amountInr).toLocaleString("en-IN")}
              </p>
              <p className="mt-0.5 text-[10px] text-muted">Bal ₹{tx.balanceAfterInr.toLocaleString("en-IN")}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
