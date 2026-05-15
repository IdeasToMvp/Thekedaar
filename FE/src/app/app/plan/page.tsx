"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ElevatedCard, PageShell } from "@/components/PageShell";
import { FeedUsageBanner } from "@/components/jobs/FeedUsageBanner";
import type { FeedLimits } from "@/lib/planLimits";

type MeUser = {
  current_mode: "worker" | "recruiter";
};

export default function PlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MeUser | null>(null);
  const [limits, setLimits] = useState<FeedLimits | null>(null);

  const load = useCallback(async () => {
    const [meResp, actResp] = await Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }),
      fetch("/api/auth/activity", { cache: "no-store" }),
    ]);
    const meData = await meResp.json().catch(() => ({}));
    if (!meResp.ok || !meData?.user) {
      router.replace("/login");
      return;
    }
    setUser(meData.user as MeUser);
    const actData = await actResp.json().catch(() => ({}));
    if (actResp.ok && actData?.limits) setLimits(actData.limits as FeedLimits);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <PageShell>
        <motion.div
          className="mx-auto h-10 w-10 rounded-full border-2 border-emerald-200 border-t-emerald-600"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="pb-24 sm:pb-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex w-full max-w-2xl flex-col gap-6"
      >
        <Link href="/app/profile" className="text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline">
          ← Profile
        </Link>

        <ElevatedCard size="lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Plan & usage</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Your subscription</h1>
          <p className="mt-2 text-sm text-slate-600">
            Contact limits and listing quotas for your current app view.
          </p>

          <motion.div className="mt-6">
            <FeedUsageBanner limits={limits} currentMode={user?.current_mode ?? "worker"} />
          </motion.div>

          <p className="mt-6 text-xs text-slate-500">
            To change hiring vs job-seeking view, use Profile → App view, then open Feed.
          </p>
        </ElevatedCard>
      </motion.div>
    </PageShell>
  );
}
