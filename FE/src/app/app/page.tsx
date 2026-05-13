"use client";

import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
    <main className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
      >
        {!supabase ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Configure Supabase env vars:
            <div className="mt-2 font-mono text-xs">
              NEXT_PUBLIC_SUPABASE_URL
              <br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </div>
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-black/70">Dashboard</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Welcome</h1>
            <p className="mt-2 text-sm text-black/70">
              Logged in as <span className="font-medium text-black">{phone ?? "…"}</span>
            </p>
            <p className="mt-2 text-sm text-black/70">
              This number should match the WhatsApp number you used to chat with Thekedaar.
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-black/15 px-3 py-2 text-sm font-medium hover:bg-black/5"
          >
            Logout
          </button>
        </div>
      </motion.div>
    </main>
  );
}

