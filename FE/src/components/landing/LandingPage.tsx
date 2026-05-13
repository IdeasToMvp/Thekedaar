"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-10 px-4 py-10 sm:gap-12 sm:px-6 sm:py-14 lg:flex-row lg:items-stretch lg:justify-between lg:py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg shrink-0 lg:max-w-xl"
      >
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-7 shadow-xl shadow-slate-200/50 ring-1 ring-white/60 backdrop-blur-sm sm:p-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400" />

          <motion.p
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-xs font-semibold uppercase tracking-wider text-emerald-700"
          >
            WhatsApp-first hiring
          </motion.p>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl"
          >
            Recruit or find work — simple, on WhatsApp
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-4 text-base leading-relaxed text-slate-600"
          >
            Maids, cooks, drivers, guards, helpers — local jobs, local people. Start on WhatsApp; we’ll send you a link to open your profile here — no password, no OTP.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link
              href="/login"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              How to sign in
            </Link>
            <Link
              href="/app"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
            >
              Dashboard
            </Link>
          </motion.div>

          <motion.p
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 text-center text-xs text-slate-500 sm:text-left"
          >
            No resume forms. We’ll guide you step by step.
          </motion.p>
        </div>
      </motion.div>

      <motion.aside
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-full max-w-lg flex-col gap-4 lg:max-w-md lg:justify-center"
      >
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-emerald-800/80 lg:text-left">
          How it works
        </p>
        <ol className="space-y-3 text-sm text-slate-700">
          {[
            "Chat with Thekedaar on WhatsApp — say what you need or what work you do.",
            "We text you a magic link. Open it once; your session stays signed in here.",
            "In the app, set Profile: hire staff, look for work, or both at once.",
          ].map((line, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                {i + 1}
              </span>
              <span className="leading-relaxed">{line}</span>
            </li>
          ))}
        </ol>
        <p className="text-center text-xs text-slate-500 lg:text-left">
          Same account for posting jobs and browsing — update anytime in Profile.
        </p>
      </motion.aside>
    </main>
  );
}
