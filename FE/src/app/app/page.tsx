"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ElevatedCard, PageShell } from "@/components/PageShell";

type MeUser = {
  id: string;
  phone: string;
  role: string;
  hiring_enabled: boolean;
  seeking_enabled: boolean;
  name: string | null;
  city: string | null;
};

export default function AppPage() {
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);
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
        if (!cancelled) setUser(data.user as MeUser);
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
    <PageShell className="items-start py-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-mono font-semibold text-slate-800">{user?.phone}</span>
              {user?.name ? (
                <>
                  {" "}
                  · <span className="font-medium text-slate-800">{user.name}</span>
                </>
              ) : null}
              {user?.city ? (
                <>
                  {" "}
                  · <span>{user.city}</span>
                </>
              ) : null}
            </p>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => void logout()}
            className="self-start rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50 sm:self-auto"
          >
            Logout
          </motion.button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`rounded-3xl border-2 p-5 shadow-sm transition ${
              user?.hiring_enabled
                ? "border-emerald-300 bg-white ring-1 ring-emerald-100"
                : "border-slate-200/80 bg-white/70 opacity-70"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Hiring</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900">Post & manage jobs</h2>
            <p className="mt-2 text-sm text-slate-600">
              {user?.hiring_enabled ? "You can post multiple jobs from WhatsApp for now." : "Turn on Hiring in Profile to use this side."}
            </p>
            <Link
              href="/app/profile"
              className="mt-4 inline-flex text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline"
            >
              {user?.hiring_enabled ? "Edit profile →" : "Enable in profile →"}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-3xl border-2 p-5 shadow-sm transition ${
              user?.seeking_enabled
                ? "border-teal-300 bg-white ring-1 ring-teal-100"
                : "border-slate-200/80 bg-white/70 opacity-70"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Looking for work</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900">Get matched to jobs</h2>
            <p className="mt-2 text-sm text-slate-600">
              {user?.seeking_enabled ? "We’ll match you by city & role. Keep details updated in Profile." : "Turn on Looking for work in Profile."}
            </p>
            <Link
              href="/app/profile"
              className="mt-4 inline-flex text-sm font-semibold text-teal-700 underline-offset-4 hover:underline"
            >
              {user?.seeking_enabled ? "Edit seeker details →" : "Enable in profile →"}
            </Link>
          </motion.div>
        </div>

        <ElevatedCard size="lg">
          <p className="text-sm text-slate-600">
            Tip: use <span className="font-semibold text-slate-800">Profile</span> to turn on{" "}
            <span className="font-semibold">both</span> Hiring and Job seeker if you hire staff and also look for work
            yourself.
          </p>
        </ElevatedCard>
      </div>
    </PageShell>
  );
}
