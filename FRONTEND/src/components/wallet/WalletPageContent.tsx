"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppNavbar } from "@/components/feed/AppNavbar";
import { useFeedUser } from "@/components/feed/FeedUserProvider";
import { ThekeCreditsTerms } from "@/components/credits/ThekeCreditsTerms";
import { openRazorpayTopUp } from "@/lib/credits/razorpayCheckout";
import { isEmployerAccount } from "@/lib/auth/accountRole";
import {
  THEKE_CREDITS_MIN_TOPUP_INR,
  THEKE_CREDITS_NAME,
} from "@/lib/credits/thekeCredits";
import { validateTopUpAmountInr } from "@/lib/credits/topupValidation";
import type { RecruiterBilling, WalletResponse, WalletTopUpConfig } from "@/lib/credits/types";
import { WalletPricingTable } from "./WalletPricingTable";

const TOPUP_PRESETS = [49, 100, 200, 500] as const;

function WalletSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm shadow-slate-900/5">
      <div className="flex items-start gap-3 border-b border-border bg-slate-50/80 px-5 py-4">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white bg-white text-lg shadow-sm"
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p> : null}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function WalletPageContent() {
  const router = useRouter();
  const { user, userLoading, cityId, setCityId } = useFeedUser();
  const [billing, setBilling] = useState<RecruiterBilling | null>(null);
  const [topUpConfig, setTopUpConfig] = useState<WalletTopUpConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [topUpLoading, setTopUpLoading] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState("100");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    setError(null);
    const resp = await fetch("/api/wallet");
    const data = (await resp.json()) as WalletResponse;
    if (!resp.ok) {
      throw new Error(data.error || "Could not load wallet");
    }
    setBilling(data.billing);
    setTopUpConfig(data.topUp ?? null);
  }, []);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace("/login?returnTo=/feed/wallet");
      return;
    }
    if (!isEmployerAccount(user)) {
      router.replace("/feed");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadWallet();
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load wallet");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, userLoading, router, loadWallet]);

  function resolveTopUpAmount(): number | null {
    const check = validateTopUpAmountInr(amountInput);
    if (!check.ok) {
      setAmountError(check.error);
      return null;
    }
    setAmountError(null);
    return check.amountInr;
  }

  async function handleTopUp(amountInr: number) {
    const check = validateTopUpAmountInr(amountInr);
    if (!check.ok) {
      setAmountError(check.error);
      return;
    }

    setTopUpLoading(check.amountInr);
    setError(null);
    setSuccess(null);
    setAmountError(null);

    try {
      if (topUpConfig?.razorpayEnabled) {
        const result = await openRazorpayTopUp({
          amountInr: check.amountInr,
          userName: user?.name,
          userPhone: user?.phone,
        });
        if (!result.ok) {
          if (result.error !== "Payment cancelled") {
            setError(result.error);
          }
          return;
        }
        await loadWallet();
        setSuccess(`₹${check.amountInr} added via UPI.`);
        return;
      }

      if (topUpConfig?.devTopUpEnabled) {
        const resp = await fetch("/api/wallet/topup/dev", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountInr: check.amountInr }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Top-up failed");
        if (data.billing) setBilling(data.billing);
        else await loadWallet();
        setSuccess(`₹${check.amountInr} added (dev mode).`);
        return;
      }

      setError("Online payments are not available. Please try again later.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Top-up failed");
    } finally {
      setTopUpLoading(null);
    }
  }

  if (userLoading && !user) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <header className="h-14 shrink-0 animate-pulse border-b border-border bg-surface" />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted">Loading…</p>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const payLabel = topUpConfig?.razorpayEnabled
    ? "Pay with UPI"
    : topUpConfig?.devTopUpEnabled
      ? "Add (dev)"
      : "Unavailable";

  const paymentsEnabled = Boolean(topUpConfig?.razorpayEnabled || topUpConfig?.devTopUpEnabled);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <AppNavbar user={user} cityId={cityId} onCityChange={setCityId} />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-4 py-6 pb-28 sm:px-6">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            ← Back to feed
          </Link>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-emerald-50 via-teal-50/90 to-slate-50 shadow-sm">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white bg-white font-serif text-2xl font-bold text-brand-dark shadow-md">
                  ₹
                </span>
                <div>
                  <span className="inline-flex rounded-full border border-brand/25 bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
                    Employer wallet
                  </span>
                  <h1 className="mt-1.5 font-serif text-2xl font-bold text-foreground sm:text-3xl">
                    {THEKE_CREDITS_NAME}
                  </h1>
                  <p className="mt-1 max-w-xl text-sm text-muted">
                    1 credit = ₹1. Used automatically when you post jobs or unlock worker contacts.
                  </p>
                </div>
              </div>
              {billing && !loading ? (
                <dl className="grid shrink-0 gap-3 sm:min-w-[12rem]">
                  <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Balance</dt>
                    <dd className="mt-0.5 font-serif text-3xl font-bold text-foreground">
                      ₹{billing.balanceInr.toLocaleString("en-IN")}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="h-20 w-full max-w-xs animate-pulse rounded-xl bg-white/60 sm:w-48" />
              )}
            </div>
          </div>

          {error ? (
            <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
              {success}
            </p>
          ) : null}

          {loading ? (
            <div className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-12">
              <div className="order-1 h-56 animate-pulse rounded-2xl bg-slate-200/60 lg:order-2 lg:col-span-5" />
              <div className="order-2 h-72 animate-pulse rounded-2xl bg-slate-200/60 lg:order-1 lg:col-span-7" />
            </div>
          ) : billing ? (
            <div className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start">
              <div className="order-2 lg:order-1 lg:col-span-7">
                <WalletSection title="Credit usage" description="All paid actions deduct from your balance." icon="📋">
                  <WalletPricingTable billing={billing} />
                </WalletSection>
              </div>

              <aside className="order-1 space-y-6 lg:order-2 lg:col-span-5 lg:sticky lg:top-6">
                <WalletSection
                  title="Add credits"
                  description={`Min ₹${THEKE_CREDITS_MIN_TOPUP_INR}. UPI only via Razorpay.`}
                  icon="➕"
                >
                  <label className="block text-xs font-medium text-muted" htmlFor="topup-amount">
                    Amount (₹)
                  </label>
                  <div className="mt-1.5 flex overflow-hidden rounded-xl border border-border bg-background shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                    <span className="flex items-center border-r border-border bg-slate-50 px-3 text-sm font-semibold text-muted">
                      ₹
                    </span>
                    <input
                      id="topup-amount"
                      type="number"
                      inputMode="numeric"
                      min={THEKE_CREDITS_MIN_TOPUP_INR}
                      step={1}
                      value={amountInput}
                      disabled={topUpLoading !== null}
                      onChange={(e) => {
                        setAmountInput(e.target.value);
                        if (amountError) setAmountError(null);
                      }}
                      className="min-h-11 w-full bg-transparent px-3 text-sm font-semibold text-foreground outline-none disabled:opacity-50"
                      aria-invalid={amountError ? true : undefined}
                      aria-describedby={amountError ? "topup-amount-error" : undefined}
                    />
                  </div>
                  {amountError ? (
                    <p id="topup-amount-error" className="mt-1.5 text-xs text-red-600" role="alert">
                      {amountError}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-muted">Minimum ₹{THEKE_CREDITS_MIN_TOPUP_INR}</p>
                  )}

                  <p className="mt-4 text-xs font-medium text-muted">Quick amounts</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {TOPUP_PRESETS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        disabled={topUpLoading !== null || !paymentsEnabled}
                        onClick={() => {
                          setAmountInput(String(amt));
                          setAmountError(null);
                        }}
                        className={`min-h-10 rounded-xl border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          amountInput === String(amt)
                            ? "border-brand bg-brand/10 text-brand-dark"
                            : "border-border bg-background text-foreground hover:border-brand hover:bg-brand/5"
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={topUpLoading !== null || !paymentsEnabled}
                    onClick={() => {
                      const amount = resolveTopUpAmount();
                      if (amount != null) void handleTopUp(amount);
                    }}
                    className="mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {topUpLoading !== null ? "Processing…" : payLabel}
                  </button>
                  {!paymentsEnabled ? (
                    <p className="mt-2 text-xs text-muted">Payments are temporarily unavailable.</p>
                  ) : topUpConfig?.razorpayEnabled ? (
                    <p className="mt-2 text-xs text-muted">You will pay with UPI (GPay, PhonePe, Paytm, etc.).</p>
                  ) : null}
                </WalletSection>

                <WalletSection title="Terms" icon="📜">
                  <ThekeCreditsTerms compact showDisclaimer />
                </WalletSection>
              </aside>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
