"use client";

import Link from "next/link";
import { useState } from "react";
import { WhatsAppHiButton } from "./WhatsAppHiButton";

const inputClass =
  "w-full min-h-12 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15";

type Props = {
  returnTo: string;
  intent?: "apply" | "hire";
  jobId?: string;
};

type View = "default" | "link_sent" | "not_registered";

export function LoginForm({ returnTo, intent, jobId }: Props) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>("default");
  const [devLoginUrl, setDevLoginUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setView("default");
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
            `${msg} Update WHATSAPP_ACCESS_TOKEN in the backend if you are an admin.`,
          );
        } else {
          setError(msg);
        }
        return;
      }
      if (data?.sent === false && data?.reason === "not_registered") {
        setView("not_registered");
        return;
      }
      if (data?.sent === false && data?.reason === "account_restricted") {
        setError(typeof data?.message === "string" ? data.message : "This account cannot sign in.");
        return;
      }
      if (data?.sent !== true) {
        setError("We could not send the link. Check your number or try again in a few minutes.");
        return;
      }
      if (typeof data?.devLoginUrl === "string") {
        setDevLoginUrl(data.devLoginUrl);
      }
      setView("link_sent");
    } finally {
      setLoading(false);
    }
  }

  if (view === "link_sent") {
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
        <button
          type="button"
          onClick={() => {
            setView("default");
            setDevLoginUrl(null);
          }}
          className="w-full text-center text-sm font-medium text-brand hover:underline"
        >
          Use a different number
        </button>
        <Link
          href={returnTo.startsWith("/") ? returnTo : "/"}
          className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-slate-50"
        >
          Back to home
        </Link>
      </div>
    );
  }

  if (view === "not_registered") {
    return (
      <div className="space-y-4">
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950"
          role="alert"
        >
          <p className="font-semibold">This number is not registered yet</p>
          <p className="mt-1">
            New users must message us on WhatsApp first. Send <strong>Hi</strong>, finish the short setup, then
            come back here to get your login link.
          </p>
        </div>
        <WhatsAppHiButton label="Send Hi on WhatsApp" />
        <button
          type="button"
          onClick={() => setView("default")}
          className="w-full text-center text-sm font-medium text-brand hover:underline"
        >
          Already registered? Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
        <h2 className="text-sm font-bold text-foreground">Already registered?</h2>
        <p className="mt-1 text-sm text-muted">
          Enter the WhatsApp number you use on Thekedaar. We will send a one-time login link (no password).
        </p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label htmlFor="login-phone" className="sr-only">
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
            {loading ? "Sending…" : "Send login link on WhatsApp"}
          </button>
        </form>
      </section>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-border" />
        </div>
        <p className="relative mx-auto w-fit bg-surface px-3 text-xs font-medium uppercase tracking-wide text-muted">
          or
        </p>
      </div>

      <section className="rounded-xl border border-border bg-slate-50/80 p-4 sm:p-5">
        <h2 className="text-sm font-bold text-foreground">New to Thekedaar?</h2>
        <p className="mt-1 text-sm text-muted">
          Message us on WhatsApp with <strong>Hi</strong>. We will set up your profile in chat — then you can sign in
          here.
        </p>
        <div className="mt-4">
          <WhatsAppHiButton label="Send Hi" />
        </div>
      </section>

      <input type="hidden" name="returnTo" value={returnTo} />
      {intent ? <input type="hidden" name="intent" value={intent} /> : null}
      {jobId ? <input type="hidden" name="jobId" value={jobId} /> : null}
    </div>
  );
}
