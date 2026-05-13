"use client";

import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ElevatedCard, PageShell } from "@/components/PageShell";

export default function AppPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        router.replace("/login");
        return;
      }
      const userPhone = (session.user.phone ?? null) as string | null;
      if (!cancelled) setPhone(userPhone);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <PageShell>
      <ElevatedCard size="lg">
        {!supabase ? (
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">Configure Supabase</p>
            <p className="mt-1 font-mono text-xs">
              NEXT_PUBLIC_SUPABASE_URL
              <br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Dashboard</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              Logged in as{" "}
              <span className="font-semibold text-slate-900">{phone ?? "…"}</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              This number should match the WhatsApp number you used with Thekedaar.
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
