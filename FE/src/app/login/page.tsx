"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Step = "PHONE" | "OTP";

function normalizePhone(input: string): string {
  const cleaned = input.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  // India-first default: if user enters 10 digits, prefix +91
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  return cleaned;
}

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
    } catch (e: any) {
      setError(e?.message ?? "Failed to send OTP");
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
    } catch (e: any) {
      setError(e?.message ?? "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
      >
        <div className="text-sm font-medium text-black/70">Login</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Continue with your mobile number</h1>
        <p className="mt-2 text-sm text-black/70">
          Use the same number you use on WhatsApp, so we can link your chats.
        </p>

        {!supabase ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Configure Supabase env vars in Vercel:
            <div className="mt-2 font-mono text-xs">
              NEXT_PUBLIC_SUPABASE_URL
              <br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </div>
          </div>
        ) : null}

        {step === "PHONE" ? (
          <div className="mt-6 space-y-3">
            <label className="block text-sm font-medium">Mobile number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40"
              inputMode="tel"
              autoComplete="tel"
            />
            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="text-sm text-black/70">
              OTP sent to <span className="font-medium text-black">{normalizePhone(phone)}</span>
            </div>
            <label className="block text-sm font-medium">OTP</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit OTP"
              className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <button
              onClick={verifyOtp}
              disabled={loading}
              className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
            <button
              onClick={() => {
                setStep("PHONE");
                setOtp("");
              }}
              className="w-full rounded-xl border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5"
            >
              Change number
            </button>
          </div>
        )}

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      </motion.div>
    </main>
  );
}

