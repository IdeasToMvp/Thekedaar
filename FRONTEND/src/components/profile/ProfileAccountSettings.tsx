"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MeUser } from "@/lib/auth/types";
import { isAccountActive, isAccountPaused } from "@/lib/auth/accountStatus";
import { SUPPORT_EMAIL } from "@/lib/supportEmail";

type Props = {
  user: MeUser;
  onStatusChange: () => void | Promise<void>;
};

export function ProfileAccountSettings({ user, onStatusChange }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"pause" | "reactivate" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const status = user.account_status ?? "active";
  const paused = isAccountPaused(status);
  const active = isAccountActive(status);

  async function handlePause() {
    setLoading("pause");
    setError(null);
    try {
      const resp = await fetch("/api/auth/account/pause", { method: "POST" });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || "Could not pause account");
      await onStatusChange();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not pause account");
    } finally {
      setLoading(null);
    }
  }

  async function handleReactivate() {
    setLoading("reactivate");
    setError(null);
    try {
      const resp = await fetch("/api/auth/account/reactivate", { method: "POST" });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || "Could not reactivate account");
      await onStatusChange();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not reactivate account");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
      setError('Type DELETE to confirm.');
      return;
    }
    setLoading("delete");
    setError(null);
    try {
      const resp = await fetch("/api/auth/account/delete", { method: "POST" });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || "Could not delete account");
      router.replace("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not delete account");
    } finally {
      setLoading(null);
      setDeleteOpen(false);
    }
  }

  const pauseLabel = user.can_hire ? "Pause profile & hiring" : "Pause profile";

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border bg-slate-50/80 px-5 py-4">
        <h2 className="text-base font-bold text-foreground">Account</h2>
        <p className="mt-0.5 text-xs text-muted">Pause or delete your Thekedaar account. Wallet credits are kept.</p>
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        {paused ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Your profile is paused — you are hidden on Find Workers and job feeds. Listings stay saved; closed
            listings remain closed.
          </div>
        ) : null}

        {active ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void handlePause()}
            className="min-h-11 w-full rounded-full border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-50 sm:w-auto sm:min-w-[220px] sm:px-6"
          >
            {loading === "pause" ? "Pausing…" : pauseLabel}
          </button>
        ) : paused ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void handleReactivate()}
            className="min-h-11 w-full rounded-full bg-brand-dark text-sm font-semibold text-white transition hover:bg-brand disabled:opacity-50 sm:w-auto sm:min-w-[200px] sm:px-6"
          >
            {loading === "reactivate" ? "Reactivating…" : "Reactivate account"}
          </button>
        ) : null}

        <div className="border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground">Delete account</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Soft-deletes your account for 30 days. You can restore via WhatsApp. Theke Credits stay in your wallet
            if you restore.
          </p>
          {!deleteOpen ? (
            <button
              type="button"
              disabled={loading !== null || !active && !paused}
              onClick={() => {
                setDeleteOpen(true);
                setDeleteConfirm("");
                setError(null);
              }}
              className="mt-3 min-h-10 rounded-full border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-50"
            >
              Delete account
            </button>
          ) : (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50/50 p-4">
              <p className="text-sm text-red-900">
                This hides your profile and listings. Type <strong>DELETE</strong> to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="mt-2 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm"
                autoComplete="off"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={loading === "delete"}
                  onClick={() => void handleDelete()}
                  className="min-h-10 rounded-full bg-red-700 px-5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {loading === "delete" ? "Deleting…" : "Confirm delete"}
                </button>
                <button
                  type="button"
                  disabled={loading === "delete"}
                  onClick={() => setDeleteOpen(false)}
                  className="min-h-10 rounded-full border border-border bg-white px-5 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        <p className="text-[11px] text-muted">
          Questions? Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-brand hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </section>
  );
}
