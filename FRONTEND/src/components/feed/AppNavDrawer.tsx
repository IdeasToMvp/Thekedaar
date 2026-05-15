"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { MeUser } from "@/lib/auth/types";
import { isEmployerAccount, isWorkerAccount } from "@/lib/auth/accountRole";
import { ThekedaarLogo } from "@/components/brand/ThekedaarLogo";
import { viewerModeLabel } from "@/lib/jobs/viewerRole";
import { FeedNavLinks } from "./FeedNavLinks";

type Props = {
  open: boolean;
  user: MeUser;
  onClose: () => void;
};

export function AppNavDrawer({ open, user, onClose }: Props) {
  const workerOnly = isWorkerAccount(user) && !isEmployerAccount(user);

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
          {!workerOnly ? <p className="text-xs text-muted">{viewerModeLabel(user)}</p> : null}
        </div>

        <FeedNavLinks
          user={user}
          onNavigate={onClose}
          className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 text-sm font-medium [&_a]:rounded-lg [&_a]:px-3 [&_a]:py-3"
        />
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
