"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ElevatedCard, PageShell } from "@/components/PageShell";

function tokenFromParams(params: ReturnType<typeof useParams>): string | null {
  const raw = params?.token;
  if (typeof raw === "string" && raw.length >= 40) return raw;
  if (Array.isArray(raw) && raw[0] && typeof raw[0] === "string" && raw[0].length >= 40) return raw[0];
  return null;
}

export default function MagicLoginPage() {
  const router = useRouter();
  const routeParams = useParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState<string>("Logging you in…");

  useEffect(() => {
    const token = tokenFromParams(routeParams);
    if (!token) {
      setStatus("error");
      setMessage("Invalid login link. Open the link again from WhatsApp.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch("/api/auth/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "Login failed");
        }
        if (cancelled) return;
        router.replace("/app");
      } catch (e: unknown) {
        if (cancelled) return;
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Login failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routeParams, router]);

  return (
    <PageShell>
      <ElevatedCard>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Thekedaar</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {status === "loading" ? "Logging you in…" : "Could not log in"}
        </h1>
        <p
          className={`mt-3 text-sm leading-relaxed sm:text-base ${status === "error" ? "font-medium text-red-800" : "text-slate-600"}`}
        >
          {message}
        </p>

        {status === "loading" ? (
          <div className="mt-8 flex justify-center">
            <motion.div
              className="h-10 w-10 rounded-full border-2 border-emerald-200 border-t-emerald-600"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : null}

        {status === "error" ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.replace("/")}
            className="mt-8 w-full rounded-2xl border-2 border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Go home
          </motion.button>
        ) : null}
      </ElevatedCard>
    </PageShell>
  );
}
