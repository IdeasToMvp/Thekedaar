"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { MeUser } from "@/lib/auth/types";
import { ThekedaarLogo } from "@/components/brand/ThekedaarLogo";
import { isWorkerView, viewerModeLabel } from "@/lib/jobs/viewerRole";
type Props = {
  open: boolean;
  user: MeUser;
  onClose: () => void;
  onSignOut: () => void;
};

export function AppNavDrawer({ open, user, onClose, onSignOut }: Props) {
  const worker = isWorkerView(user);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close menu"
        onClick={onClose}
      />
      <nav className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <ThekedaarLogo variant="lockup" href="/feed" />
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-slate-100"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-foreground">{user.name || user.phone}</p>
          <p className="text-xs text-muted">{viewerModeLabel(user)}</p>
        </div>

        <ul className="flex-1 space-y-1 overflow-y-auto p-3 text-sm font-medium">
          <li>
            <Link
              href="/feed"
              onClick={onClose}
              className="block rounded-lg bg-brand/10 px-3 py-3 text-brand"
            >
              Find Jobs
            </Link>
          </li>
          <li>
            <span className="block rounded-lg px-3 py-3 text-muted" title="Coming soon">
              {worker ? "My Applications" : "My Listings"}
            </span>
          </li>
          <li>
            <span className="block rounded-lg px-3 py-3 text-muted" title="Coming soon">
              Messages
            </span>
          </li>
        </ul>

        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="w-full rounded-xl border border-border py-3 text-sm font-semibold text-foreground transition hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </nav>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
