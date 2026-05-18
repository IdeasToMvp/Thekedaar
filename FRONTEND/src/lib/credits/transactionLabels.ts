import type { WalletTransaction } from "./types";

const TYPE_LABELS: Record<string, string> = {
  topup: "Credits added",
  debit_listing: "Job listing posted",
  debit_unlock: "Worker contact unlocked",
  debit_urgent: "Urgent badge",
  admin_adjust: "Balance adjustment",
  refund: "Refund",
};

export function walletTransactionLabel(tx: WalletTransaction): string {
  const base = TYPE_LABELS[tx.type] ?? tx.type.replace(/_/g, " ");
  const meta = tx.metadata;
  if (tx.type === "debit_listing" && typeof meta?.amountInr === "number") {
    return base;
  }
  if (tx.type === "topup" && meta?.mode === "dev") {
    return "Credits added (dev)";
  }
  return base;
}

export function walletTransactionDetail(tx: WalletTransaction): string | null {
  const meta = tx.metadata;
  if (tx.type === "debit_unlock" && typeof meta?.workerId === "string") {
    return "Find Workers contact";
  }
  if (tx.type === "debit_urgent" && meta?.source === "edit_upgrade") {
    return "Upgraded listing to Immediate";
  }
  if (tx.type === "debit_listing") {
    return "New job on feed";
  }
  if (tx.type === "topup") {
    return "Wallet top-up";
  }
  return null;
}

export function isCreditIn(tx: WalletTransaction): boolean {
  return tx.amountInr > 0;
}
