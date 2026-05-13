"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { ElevatedCard, PageShell } from "@/components/PageShell";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20";

export default function LoginInfoPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const trimmed = phone.trim();
    if (trimmed.length < 8) {
      setError("Enter a valid mobile number.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch("/api/auth/request-login-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmed }),
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        setError(typeof data?.error === "string" ? data.error : "Too many requests. Try again later.");
        return;
      }
      if (!resp.ok) {
        setError(typeof data?.error === "string" ? data.error : "Something went wrong.");
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <ElevatedCard>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Sign in</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Use your WhatsApp link</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          Thekedaar does not use passwords or SMS OTP on the website. After you chat with us on WhatsApp, we send you a
          <span className="font-semibold text-slate-800"> personal link</span> — tap it to open the site already signed in.
        </p>

        <ul className="mt-6 space-y-3 text-sm text-slate-700">
          <li className="flex gap-2">
            <span className="mt-0.5 font-bold text-emerald-600">1.</span>
            <span>Open WhatsApp and message Thekedaar (same number you used before).</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 font-bold text-emerald-600">2.</span>
            <span>Finish the short questions there.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 font-bold text-emerald-600">3.</span>
            <span>Tap the link we send — it logs you in automatically.</span>
          </li>
        </ul>

        <div className="mt-8 border-t border-slate-200/80 pt-8">
          <h2 className="text-sm font-semibold text-slate-900">Already registered? Get a new link</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Enter the same mobile number you use on WhatsApp. If it&apos;s on file, we&apos;ll send a fresh one-time link there — check your WhatsApp messages.
          </p>

          {done ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-2xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-950"
              role="status"
            >
              If this number is registered with Thekedaar, we sent a new link on WhatsApp. Open WhatsApp and tap the link to continue.
            </motion.div>
          ) : (
            <div className="mt-4 space-y-3">
              <label htmlFor="relogin-phone" className="sr-only">
                Mobile number
              </label>
              <input
                id="relogin-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile number (e.g. 9876543210)"
                className={inputClass}
                inputMode="tel"
                autoComplete="tel"
                disabled={loading}
              />
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={submit}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send link on WhatsApp"}
              </motion.button>
            </div>
          )}

          {error ? (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <motion.div className="mt-8" whileTap={{ scale: 0.98 }}>
          <Link
            href="/"
            className="flex h-12 w-full items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Back to home
          </Link>
        </motion.div>
      </ElevatedCard>
    </PageShell>
  );
}
