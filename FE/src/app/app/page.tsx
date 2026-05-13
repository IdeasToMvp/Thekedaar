"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ElevatedCard, PageShell } from "@/components/PageShell";

type SessionUser = { sub: string; phone: string; role: string };

export default function AppPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data?.user) {
          if (!cancelled) router.replace("/login");
          return;
        }
        if (!cancelled) setUser(data.user as SessionUser);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="h-10 w-10 rounded-full border-2 border-emerald-200 border-t-emerald-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm font-medium text-slate-600">Loading your account…</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ElevatedCard size="lg">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Dashboard</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              Signed in as{" "}
              <span className="font-semibold text-slate-900">{user?.phone ?? "…"}</span>
              {user?.role ? (
                <>
                  {" "}
                  · <span className="capitalize">{user.role}</span>
                </>
              ) : null}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              This should match the WhatsApp number you used with Thekedaar.
            </p>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={logout}
            className="shrink-0 rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Logout
          </motion.button>
        </div>
      </ElevatedCard>
    </PageShell>
  );
}
