"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MeUser } from "@/lib/auth/types";
import { ACTIVE_MARKET } from "@/lib/launch";
import { isWorkerView, viewerModeLabel } from "@/lib/jobs/viewerRole";
import { AppNavDrawer } from "./AppNavDrawer";

type Props = {
  user: MeUser;
};

export function AppNavbar({ user }: Props) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const worker = isWorkerView(user);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header className="z-50 shrink-0 border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
          <Link href="/feed" className="shrink-0 font-serif text-xl font-bold tracking-tight text-brand">
            Thekedaar
          </Link>

          <p className="hidden text-xs text-muted sm:block">{ACTIVE_MARKET.regionLabel}</p>

          <nav className="hidden flex-1 items-center justify-center gap-8 text-sm font-medium lg:flex">
            <Link href="/feed" className="border-b-2 border-brand pb-0.5 text-foreground">
              Find Jobs
            </Link>
            {worker ? (
              <span className="cursor-default text-muted" title="Coming soon">
                My Applications
              </span>
            ) : (
              <span className="cursor-default text-muted" title="Coming soon">
                My Listings
              </span>
            )}
            <span className="cursor-default text-muted" title="Coming soon">
              Messages
            </span>
            <button
              type="button"
              onClick={signOut}
              className="text-muted transition hover:text-foreground"
            >
              Sign out
            </button>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden text-xs font-medium text-muted md:inline">{viewerModeLabel(user)}</span>
            <span
              className="hidden h-9 w-9 items-center justify-center rounded-full bg-brand/15 text-sm font-bold text-brand sm:flex"
              title={user.name || user.phone}
            >
              {(user.name || user.phone).slice(0, 1).toUpperCase()}
            </span>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground lg:hidden"
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      <AppNavDrawer
        open={drawerOpen}
        user={user}
        onClose={() => setDrawerOpen(false)}
        onSignOut={signOut}
      />
    </>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
