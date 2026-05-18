import { supabaseAdmin } from "./supabase.service";
import { InsufficientCreditsError } from "../errors/walletErrors";
import { MIN_TOPUP_PAISE, ONBOARDING_CREDITS_PAISE, paiseToInr } from "../utils/creditPricing";

export type WalletTransactionType =
  | "topup"
  | "debit_listing"
  | "debit_unlock"
  | "debit_urgent"
  | "admin_adjust"
  | "refund";

export type WalletTransactionRow = {
  id: string;
  type: WalletTransactionType;
  amount_paise: number;
  balance_after_paise: number;
  reference: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function getOrCreateWallet(userId: string): Promise<{ balance_paise: number }> {
  const sb = supabaseAdmin();
  const { data: existing, error: selErr } = await sb
    .from("wallets")
    .select("balance_paise")
    .eq("user_id", userId)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) {
    return { balance_paise: Number((existing as { balance_paise: number }).balance_paise) };
  }

  const { data: inserted, error: insErr } = await sb
    .from("wallets")
    .insert({ user_id: userId, balance_paise: 0 })
    .select("balance_paise")
    .single();
  if (insErr) throw insErr;
  return { balance_paise: Number((inserted as { balance_paise: number }).balance_paise) };
}

export async function getWalletBalancePaise(userId: string): Promise<number> {
  const w = await getOrCreateWallet(userId);
  return w.balance_paise;
}

async function applyBalanceChange(input: {
  userId: string;
  deltaPaise: number;
  type: WalletTransactionType;
  reference?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ balance_paise: number; transaction_id: string }> {
  if (input.deltaPaise === 0) {
    throw new Error("Transaction amount cannot be zero");
  }

  const sb = supabaseAdmin();
  await getOrCreateWallet(input.userId);

  const { data: wallet, error: wErr } = await sb
    .from("wallets")
    .select("balance_paise")
    .eq("user_id", input.userId)
    .single();
  if (wErr) throw wErr;

  const current = Number((wallet as { balance_paise: number }).balance_paise);
  const next = current + input.deltaPaise;
  if (next < 0) {
    throw new InsufficientCreditsError(-input.deltaPaise, current);
  }

  const { error: updErr } = await sb
    .from("wallets")
    .update({ balance_paise: next, updated_at: new Date().toISOString() })
    .eq("user_id", input.userId);
  if (updErr) throw updErr;

  const { data: tx, error: txErr } = await sb
    .from("wallet_transactions")
    .insert({
      user_id: input.userId,
      type: input.type,
      amount_paise: input.deltaPaise,
      balance_after_paise: next,
      reference: input.reference ?? null,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();
  if (txErr) {
    await sb
      .from("wallets")
      .update({ balance_paise: current, updated_at: new Date().toISOString() })
      .eq("user_id", input.userId);
    throw txErr;
  }

  return { balance_paise: next, transaction_id: (tx as { id: string }).id };
}

/** One-time ₹100 welcome credits when employer profile is created. */
export async function grantOnboardingCredits(userId: string): Promise<boolean> {
  const reference = `onboarding:${userId}`;
  try {
    await creditTopUp({
      userId,
      amountPaise: ONBOARDING_CREDITS_PAISE,
      reference,
      metadata: { reason: "onboarding_bonus", amountInr: paiseToInr(ONBOARDING_CREDITS_PAISE) },
    });
    return true;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    const code = e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "23505" || msg.includes("duplicate") || msg.includes("unique")) {
      return false;
    }
    throw e;
  }
}

export async function creditTopUp(input: {
  userId: string;
  amountPaise: number;
  reference: string;
  metadata?: Record<string, unknown>;
}): Promise<{ balance_paise: number }> {
  if (input.amountPaise < MIN_TOPUP_PAISE) {
    throw new Error(`Minimum top-up is ₹${MIN_TOPUP_PAISE / 100}`);
  }
  const result = await applyBalanceChange({
    userId: input.userId,
    deltaPaise: input.amountPaise,
    type: "topup",
    reference: input.reference,
    metadata: input.metadata,
  });
  return { balance_paise: result.balance_paise };
}

export async function debitCredits(input: {
  userId: string;
  amountPaise: number;
  type: Extract<WalletTransactionType, "debit_listing" | "debit_unlock" | "debit_urgent">;
  reference?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ balance_paise: number }> {
  if (input.amountPaise <= 0) throw new Error("Debit amount must be positive");
  const result = await applyBalanceChange({
    userId: input.userId,
    deltaPaise: -input.amountPaise,
    type: input.type,
    reference: input.reference ?? null,
    metadata: input.metadata,
  });
  return { balance_paise: result.balance_paise };
}

export async function listWalletTransactions(
  userId: string,
  limit = 20,
): Promise<WalletTransactionRow[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("wallet_transactions")
    .select("id,type,amount_paise,balance_after_paise,reference,metadata,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: (r as { id: string }).id,
    type: (r as { type: WalletTransactionType }).type,
    amount_paise: Number((r as { amount_paise: number }).amount_paise),
    balance_after_paise: Number((r as { balance_after_paise: number }).balance_after_paise),
    reference: (r as { reference: string | null }).reference,
    metadata: ((r as { metadata: Record<string, unknown> }).metadata ?? {}) as Record<string, unknown>,
    created_at: (r as { created_at: string }).created_at,
  }));
}
