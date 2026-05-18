"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { MeUser } from "@/lib/auth/types";
import { isEmployerAccount, isWorkerAccount } from "@/lib/auth/accountRole";
import { THEKE_CREDITS_NAME } from "@/lib/credits/thekeCredits";
import type { WalletResponse } from "@/lib/credits/types";
import { ThekedaarLogo } from "@/components/brand/ThekedaarLogo";
import { viewerModeLabel } from "@/lib/jobs/viewerRole";

type Props = {
  open: boolean;
  user: MeUser;
  onClose: () => void;
};

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

function avatarInitial(name: string, phone: string): string {
  return (name || phone || "?").trim().slice(0, 1).toUpperCase();
}

export function AppNavDrawer({ open, user, onClose }: Props) {
  const pathname = usePathname();
  const employer = isEmployerAccount(user);
  const workerOnly = isWorkerAccount(user) && !employer;
  const [balanceInr, setBalanceInr] = useState<number | null>(null);

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

  useEffect(() => {
    if (!open || !employer) return;
    let cancelled = false;
    void fetch("/api/wallet")
      .then((r) => r.json())
      .then((data: WalletResponse) => {
        if (!cancelled && data.billing) setBalanceInr(data.billing.balanceInr);
      })
      .catch(() => {
        if (!cancelled) setBalanceInr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, employer]);

  if (!open) return null;

  const workerLinks: NavItem[] = [
    { href: "/feed", label: "Find Jobs", icon: <SearchIcon /> },
    { href: "/feed/applied", label: "Applied", icon: <ChecklistIcon /> },
  ];

  const employerLinks: NavItem[] = [
    { href: "/feed", label: "Find Workers", icon: <UsersIcon /> },
    { href: "/feed/my-listings", label: "My Listings", icon: <BriefcaseIcon /> },
    { href: "/feed/applications", label: "Applications", icon: <InboxIcon /> },
    { href: "/feed/contacted", label: "Contacted", icon: <PhoneIcon /> },
  ];

  const navItems = employer ? employerLinks : workerOnly || isWorkerAccount(user) ? workerLinks : [];

  const displayName = user.name?.trim() || "Your account";

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close menu"
        onClick={onClose}
      />

      <nav className="absolute right-0 top-0 flex h-full w-[min(100%,18.5rem)] flex-col bg-surface shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border/80 px-4 py-3.5">
          <ThekedaarLogo variant="lockup" href="/feed" />
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition hover:bg-slate-100"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="shrink-0 border-b border-border/80 bg-gradient-to-br from-emerald-50 via-teal-50/90 to-slate-50 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-white bg-white font-serif text-lg font-bold text-brand-dark shadow-sm">
              {avatarInitial(user.name ?? "", user.phone)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-foreground">{displayName}</p>
              <p className="text-xs text-muted">{workerOnly ? "Worker" : viewerModeLabel(user)}</p>
            </div>
          </div>

          {employer ? (
            <Link
              href="/feed/wallet"
              onClick={onClose}
              className={`mt-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3 shadow-md transition ${
                pathname === "/feed/wallet"
                  ? "bg-brand-dark text-white ring-2 ring-brand/40"
                  : "bg-brand text-white hover:bg-brand-dark"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-sm font-bold">
                  ₹
                </span>
                <span>
                  <span className="block text-sm font-semibold">{THEKE_CREDITS_NAME}</span>
                  <span className={`block text-[11px] ${pathname === "/feed/wallet" ? "text-white/85" : "text-white/90"}`}>
                    {balanceInr != null ? `Balance ₹${balanceInr}` : "Wallet & top-up"}
                  </span>
                </span>
              </span>
              <ChevronIcon />
            </Link>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Menu</p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-brand/10 text-brand-dark ring-1 ring-brand/20"
                        : "text-foreground hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        active ? "bg-brand text-white" : "bg-slate-100 text-muted"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/feed/profile"
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  pathname === "/feed/profile"
                    ? "bg-brand/10 text-brand-dark ring-1 ring-brand/20"
                    : "text-foreground hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    pathname === "/feed/profile" ? "bg-brand text-white" : "bg-slate-100 text-muted"
                  }`}
                >
                  <UserIcon />
                </span>
                Profile
              </Link>
            </li>
          </ul>
        </div>

        <div className="border-t border-border/80 p-4">
          <p className="text-center text-[11px] text-muted">Gurugram · Thekedaar</p>
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

function ChevronIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function ChecklistIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
