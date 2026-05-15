"use client";

import Link from "next/link";
import { useState } from "react";

const inputClass =
  "w-full min-h-12 rounded-xl border border-border bg-slate-50/80 px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

type Props = {
  returnTo: string;
  intent?: "apply" | "hire";
  jobId?: string;
};

export function LoginForm({ returnTo, intent, jobId }: Props) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [devLoginUrl, setDevLoginUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL?.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
        const msg = typeof data?.error === "string" ? data.error : "Something went wrong.";
        if (msg.includes("190") || msg.toLowerCase().includes("authentication error")) {
          setError(
            `${msg} Fix WHATSAPP_ACCESS_TOKEN in the backend .env (Meta Developer Console → your app → WhatsApp → API setup → generate a new token).`,
          );
        } else {
          setError(msg);
        }
        return;
      }
      if (data?.sent === false && data?.reason === "not_registered") {
        setError(
          "This number is not registered with Thekedaar yet. Message us on WhatsApp first (send Hi), finish setup, then request a link here.",
        );
        return;
      }
      if (data?.sent !== true) {
        setError("We could not send the link. Check your number or try again in a few minutes.");
        return;
      }
      if (typeof data?.devLoginUrl === "string") {
        setDevLoginUrl(data.devLoginUrl);
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-950"
          role="status"
        >
          {devLoginUrl
            ? "WhatsApp is not configured — use the dev sign-in link below (local only)."
            : "We sent a sign-in link on WhatsApp. Open WhatsApp and tap the link to continue."}
        </div>
        {devLoginUrl ? (
          <Link
            href={devLoginUrl}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Open sign-in link
          </Link>
        ) : null}
        <Link
          href={returnTo.startsWith("/") ? returnTo : "/"}
          className="flex min-h-12 w-full items-center justify-center rounded-xl border border-border bg-white px-6 text-sm font-semibold text-foreground transition hover:bg-slate-50"
        >
          Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <ul className="space-y-3 text-sm text-muted">
        <li className="flex gap-2">
          <span className="font-bold text-brand">1.</span>
          <span>Enter your WhatsApp mobile number below.</span>
        </li>
        <li className="flex gap-2">
          <span className="font-bold text-brand">2.</span>
          <span>We send a personal link on WhatsApp (no SMS OTP, no password).</span>
        </li>
        <li className="flex gap-2">
          <span className="font-bold text-brand">3.</span>
          <span>Tap the link — you are signed in on this device.</span>
        </li>
      </ul>

      <div className="space-y-3 border-t border-border/80 pt-6">
        <label htmlFor="login-phone" className="block text-sm font-semibold text-foreground">
          Mobile number
        </label>
        <input
          id="login-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 9876543210"
          className={inputClass}
          inputMode="tel"
          autoComplete="tel"
          disabled={loading}
          required
        />
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send link on WhatsApp"}
        </button>
      </div>

      {whatsappUrl ? (
        <p className="text-center text-sm text-muted">
          New here?{" "}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            Message us on WhatsApp
          </a>{" "}
          to get started.
        </p>
      ) : null}

      <input type="hidden" name="returnTo" value={returnTo} />
      {intent ? <input type="hidden" name="intent" value={intent} /> : null}
      {jobId ? <input type="hidden" name="jobId" value={jobId} /> : null}
    </form>
  );
}
