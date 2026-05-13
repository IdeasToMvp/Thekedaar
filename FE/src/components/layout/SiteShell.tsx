"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      if (!cancelled) setAuthed(r.ok);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const onApp = pathname?.startsWith("/app") ?? false;

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-emerald-200/50 blur-3xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.65, 0.45] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-amber-100/60 blur-3xl"
          animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.5, 0.35] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/3 h-[20rem] w-[36rem] -translate-x-1/2 rounded-full bg-white/40 blur-3xl"
          animate={{ x: ["-45%", "-50%", "-55%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <header className="relative z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2 text-slate-900">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm shadow-emerald-600/25">
              T
            </span>
            <span className="truncate text-base font-semibold tracking-tight">Thekedaar</span>
          </Link>

          <nav className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 text-sm sm:gap-2">
            {authed ? (
              <>
                <Link
                  href="/app"
                  className={`rounded-full px-3 py-1.5 font-medium transition ${
                    onApp && pathname === "/app"
                      ? "bg-emerald-100 text-emerald-900"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/app/profile"
                  className={`rounded-full px-3 py-1.5 font-medium transition ${
                    pathname === "/app/profile" ? "bg-emerald-100 text-emerald-900" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Profile
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
