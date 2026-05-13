"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ElevatedCard, PageShell } from "@/components/PageShell";

export default function LoginInfoPage() {
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

        <motion.div className="mt-8" whileTap={{ scale: 0.98 }}>
          <Link
            href="/"
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
          >
            Back to home
          </Link>
        </motion.div>
      </ElevatedCard>
    </PageShell>
  );
}
