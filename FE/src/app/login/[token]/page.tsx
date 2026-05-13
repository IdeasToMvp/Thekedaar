"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function MagicLoginPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState<string>("Logging you in…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch("/api/auth/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: params.token }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(data?.error ?? "Login failed");
        }
        if (cancelled) return;
        router.replace("/app");
      } catch (e: any) {
        if (cancelled) return;
        setStatus("error");
        setMessage(e?.message ?? "Login failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.token, router]);

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
      >
        <div className="text-sm font-medium text-black/70">Thekedaar</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {status === "loading" ? "Logging in…" : "Could not log in"}
        </h1>
        <p className={`mt-3 text-sm ${status === "error" ? "text-red-600" : "text-black/70"}`}>{message}</p>

        {status === "error" ? (
          <button
            onClick={() => router.replace("/")}
            className="mt-6 w-full rounded-xl border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            Go home
          </button>
        ) : null}
      </motion.div>
    </main>
  );
}

