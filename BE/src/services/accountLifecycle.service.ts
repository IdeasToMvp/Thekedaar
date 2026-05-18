import { supabaseAdmin } from "./supabase.service";
import { getUserById, getUserByPhone, type UserRow } from "./user.service";
import { AccountRestrictedError } from "../errors/accountErrors";
import { normalizePhoneForWhatsApp } from "../utils/phone";
import { setConversationState, type ConversationStep } from "./conversation.service";

export type AccountStatus = "active" | "paused" | "deleted" | "banned";

const DELETED_RECOVERY_DAYS = 30;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL?.trim() || "laddi0399@gmail.com";

export function supportEmailLine(): string {
  return `Please contact support at ${SUPPORT_EMAIL}.`;
}

export function isWithinDeletedRecoveryWindow(deletedAt: string | null | undefined): boolean {
  if (!deletedAt) return false;
  const deletedMs = new Date(deletedAt).getTime();
  if (!Number.isFinite(deletedMs)) return false;
  return Date.now() - deletedMs <= DELETED_RECOVERY_DAYS * 24 * 60 * 60 * 1000;
}

export function accountStatusOf(user: UserRow | null | undefined): AccountStatus {
  const s = user?.account_status;
  if (s === "paused" || s === "deleted" || s === "banned") return s;
  return "active";
}

export function isPubliclyVisibleAccount(user: UserRow | null | undefined): boolean {
  return accountStatusOf(user) === "active";
}

export async function assertUserCanAuthenticate(userId: string): Promise<UserRow> {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  const status = accountStatusOf(user);
  if (status === "banned") {
    throw new AccountRestrictedError(
      "ACCOUNT_BANNED",
      `Your account is currently restricted. ${supportEmailLine()}`,
    );
  }
  if (status === "deleted") {
    throw new AccountRestrictedError(
      "ACCOUNT_DELETED",
      "This account has been deleted. Restore it via WhatsApp or contact support.",
    );
  }
  return user;
}

export async function assertUserCanMutate(userId: string): Promise<UserRow> {
  const user = await assertUserCanAuthenticate(userId);
  if (accountStatusOf(user) === "paused") {
    throw new Error("Your profile is paused. Reactivate it from Profile settings or WhatsApp.");
  }
  return user;
}

export async function pauseAccount(userId: string): Promise<UserRow> {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  if (accountStatusOf(user) !== "active") {
    throw new Error("Only active accounts can be paused");
  }
  const sb = supabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("users")
    .update({
      account_status: "paused",
      paused_at: now,
      updated_at: now,
    })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  const row = data as UserRow;
  if (row.phone) {
    await setConversationState(row.phone, "ACCOUNT_PAUSED_CHOICE" as ConversationStep, { userId }, {
      last_intent: "paused_from_app",
      current_flow: "idle",
    });
  }
  return row;
}

export async function deleteAccount(userId: string): Promise<UserRow> {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  const status = accountStatusOf(user);
  if (status === "banned") throw new Error("This account cannot be deleted");
  if (status === "deleted") throw new Error("Account is already deleted");

  const sb = supabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("users")
    .update({
      account_status: "deleted",
      deleted_at: now,
      paused_at: null,
      updated_at: now,
    })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data as UserRow;
}

/** Reactivate a paused account or restore a soft-deleted account. */
export async function reactivateAccount(userId: string): Promise<UserRow> {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  const status = accountStatusOf(user);
  if (status === "banned") throw new Error("This account cannot be reactivated");
  if (status === "active") return user;

  const sb = supabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("users")
    .update({
      account_status: "active",
      paused_at: null,
      deleted_at: null,
      updated_at: now,
    })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data as UserRow;
}

/** Fresh start after delete: activate user, clear profiles, close open listings. */
export async function createNewAccountAfterDelete(userId: string): Promise<UserRow> {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  if (accountStatusOf(user) === "banned") {
    throw new Error("This account is restricted");
  }

  const sb = supabaseAdmin();
  const now = new Date().toISOString();

  await sb
    .from("jobs")
    .update({ listing_status: "closed", closed_at: now, updated_at: now })
    .eq("recruiter_id", userId)
    .eq("listing_status", "open");

  await sb.from("worker_profiles").delete().eq("user_id", userId);
  await sb.from("recruiter_profiles").delete().eq("user_id", userId);

  const { data, error } = await sb
    .from("users")
    .update({
      account_status: "active",
      deleted_at: null,
      paused_at: null,
      updated_at: now,
    })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data as UserRow;
}

/** Resolve user by WhatsApp `from` id — tries normalized 91-prefix and raw digits. */
export async function getUserByPhoneForLifecycle(phone: string): Promise<UserRow | null> {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (normalized) {
    const byNorm = await getUserByPhone(normalized);
    if (byNorm) return byNorm;
  }
  const direct = await getUserByPhone(phone);
  if (direct) return direct;
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    const byDigits = await getUserByPhone(digits);
    if (byDigits) return byDigits;
    if (digits.length === 10) {
      const with91 = await getUserByPhone(`91${digits}`);
      if (with91) return with91;
    }
  }
  return null;
}

export const PAUSED_WELCOME_MESSAGE =
  "Welcome back to Thekedaar 👋\nYour profile is currently paused.\n\nWould you like to reactivate your account?\n\n1. Yes, Reactivate\n2. Keep Paused";

export const DELETED_RECOVERY_MESSAGE =
  "We found a previously deleted account linked to this number.\n\n1. Restore Account\n2. Create New Account";

export const BANNED_MESSAGE = `Your account is currently restricted. ${supportEmailLine()}`;

export function parsePausedChoice(text: string): "reactivate" | "keep_paused" | null {
  const t = text.trim().toLowerCase();
  if (t === "1" || t.includes("reactivate") || t === "yes") return "reactivate";
  if (t === "2" || t.includes("keep") || t.includes("paused") || t === "no") return "keep_paused";
  return null;
}

export function parseDeletedRecoveryChoice(text: string): "restore" | "create_new" | null {
  const t = text.trim().toLowerCase();
  if (t === "1" || t.includes("restore")) return "restore";
  if (t === "2" || t.includes("new") || t.includes("create")) return "create_new";
  return null;
}
