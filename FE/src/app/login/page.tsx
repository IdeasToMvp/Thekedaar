"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { ElevatedCard, PageShell } from "@/components/PageShell";

type Step = "PHONE" | "OTP";

function normalizePhone(input: string): string {
  const cleaned = input.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  return cleaned;
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [step, setStep] = useState<Step>("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp() {
    setError(null);
    if (!supabase) {
      setError("Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    const p = normalizePhone(phone.trim());
    if (!p) {
      setError("Enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({ phone: p });
      if (err) throw err;
      setStep("OTP");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError(null);
    if (!supabase) {
      setError("Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    const p = normalizePhone(phone.trim());
    if (!p || !otp.trim()) {
      setError("Enter OTP sent to your phone.");
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.verifyOtp({
        phone: p,
        token: otp.trim(),
        type: "sms",
      });
      if (err) throw err;

      router.replace("/app");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <ElevatedCard>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Login</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Continue with your number</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          Use the same mobile number you use on WhatsApp so we can link your chats.
        </p>

        {!supabase ? (
          <div className="mt-6 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">Configure Supabase on Vercel</p>
            <p className="mt-1 font-mono text-xs text-amber-900/90">
              NEXT_PUBLIC_SUPABASE_URL
              <br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </p>
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          {step === "PHONE" ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.22 }}
              className="mt-8 space-y-4"
            >
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-800">
                  Mobile number
                </label>
                <input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className={inputClass}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={sendOtp}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Sending OTP…" : "Send OTP"}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22 }}
              className="mt-8 space-y-4"
            >
              <p className="text-sm text-slate-600">
                OTP sent to{" "}
                <span className="font-semibold text-slate-900">{normalizePhone(phone)}</span>
              </p>
              <div>
                <label htmlFor="otp" className="mb-2 block text-sm font-semibold text-slate-800">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit code"
                  className={inputClass}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={verifyOtp}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Verifying…" : "Verify & continue"}
              </motion.button>
              <button
                type="button"
                onClick={() => {
                  setStep("PHONE");
                  setOtp("");
                }}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Change number
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error ? (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
            role="alert"
          >
            {error}
          </motion.p>
        ) : null}
      </ElevatedCard>
    </PageShell>
  );
}
