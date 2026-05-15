"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MeUser } from "@/lib/auth/types";
import { ThekedaarLogo } from "@/components/brand/ThekedaarLogo";
import { isWorkerView, viewerModeLabel } from "@/lib/jobs/viewerRole";
import { AppNavDrawer } from "./AppNavDrawer";
import { MarketCitySelect } from "./MarketCitySelect";

type Props = {
  user: MeUser;
  cityId: string;
  onCityChange: (cityId: string) => void;
};

export function AppNavbar({ user, cityId, onCityChange }: Props) {
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
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:gap-4 sm:px-6">
          <ThekedaarLogo variant="lockup" href="/feed" priority />

          <MarketCitySelect
            cityId={cityId}
            onCityChange={onCityChange}
            size="sm"
            className="min-w-0 max-w-[9.5rem] shrink [&_span]:sr-only"
          />

          <nav className="hidden flex-1 items-center justify-center gap-8 text-sm font-medium lg:flex">
            <span className="border-b-2 border-brand pb-0.5 text-foreground">Find Jobs</span>
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
